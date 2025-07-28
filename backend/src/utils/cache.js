const redis = require('redis');
const logger = require('./logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initialize();
  }

  async initialize() {
    try {
      // Only use Redis if URL is provided
      if (process.env.REDIS_URL) {
        this.client = redis.createClient({
          url: process.env.REDIS_URL,
          password: process.env.REDIS_PASSWORD || undefined,
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              logger.warn('Redis connection refused, using memory cache');
              return undefined; // Don't retry
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Retry time exhausted');
            }
            if (options.attempt > 10) {
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        this.client.on('connect', () => {
          logger.info('Redis client connected');
          this.isConnected = true;
        });

        this.client.on('error', (err) => {
          logger.warn('Redis client error, falling back to memory cache:', err.message);
          this.isConnected = false;
        });

        this.client.on('end', () => {
          logger.warn('Redis client disconnected');
          this.isConnected = false;
        });

        await this.client.connect();
      } else {
        logger.info('No Redis URL provided, using memory cache only');
        this.initializeMemoryCache();
      }
    } catch (error) {
      logger.warn('Failed to connect to Redis, using memory cache:', error.message);
      this.initializeMemoryCache();
    }
  }

  initializeMemoryCache() {
    // Simple in-memory cache fallback
    this.memoryCache = new Map();
    this.cacheTimers = new Map();
    this.isConnected = false;
  }

  async get(key) {
    try {
      if (this.isConnected && this.client) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Memory cache fallback
        return this.memoryCache.get(key) || null;
      }
    } catch (error) {
      logger.warn(`Cache get error for key ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (this.isConnected && this.client) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        // Memory cache fallback
        this.memoryCache.set(key, value);
        
        // Clear existing timer
        if (this.cacheTimers.has(key)) {
          clearTimeout(this.cacheTimers.get(key));
        }
        
        // Set expiration timer
        const timer = setTimeout(() => {
          this.memoryCache.delete(key);
          this.cacheTimers.delete(key);
        }, ttlSeconds * 1000);
        
        this.cacheTimers.set(key, timer);
      }
      
      return true;
    } catch (error) {
      logger.warn(`Cache set error for key ${key}:`, error.message);
      return false;
    }
  }

  async del(key) {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      } else {
        // Memory cache fallback
        this.memoryCache.delete(key);
        if (this.cacheTimers.has(key)) {
          clearTimeout(this.cacheTimers.get(key));
          this.cacheTimers.delete(key);
        }
      }
      
      return true;
    } catch (error) {
      logger.warn(`Cache delete error for key ${key}:`, error.message);
      return false;
    }
  }

  async flushPattern(pattern) {
    try {
      if (this.isConnected && this.client) {
        // Get all keys matching pattern
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        // Memory cache fallback - remove keys matching pattern
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
            if (this.cacheTimers.has(key)) {
              clearTimeout(this.cacheTimers.get(key));
              this.cacheTimers.delete(key);
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      logger.warn(`Cache flush pattern error for ${pattern}:`, error.message);
      return false;
    }
  }

  async flushAll() {
    try {
      if (this.isConnected && this.client) {
        await this.client.flushAll();
      } else {
        // Memory cache fallback
        this.memoryCache.clear();
        for (const timer of this.cacheTimers.values()) {
          clearTimeout(timer);
        }
        this.cacheTimers.clear();
      }
      
      return true;
    } catch (error) {
      logger.warn('Cache flush all error:', error.message);
      return false;
    }
  }

  async exists(key) {
    try {
      if (this.isConnected && this.client) {
        return await this.client.exists(key);
      } else {
        return this.memoryCache.has(key);
      }
    } catch (error) {
      logger.warn(`Cache exists error for key ${key}:`, error.message);
      return false;
    }
  }

  async ttl(key) {
    try {
      if (this.isConnected && this.client) {
        return await this.client.ttl(key);
      } else {
        // Memory cache doesn't track TTL precisely
        return this.memoryCache.has(key) ? 1 : -2;
      }
    } catch (error) {
      logger.warn(`Cache TTL error for key ${key}:`, error.message);
      return -2;
    }
  }

  // Utility method to generate cache keys
  static generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }

  // Method to get cache stats
  async getStats() {
    try {
      if (this.isConnected && this.client) {
        const info = await this.client.info('memory');
        return {
          type: 'redis',
          connected: true,
          memory: info
        };
      } else {
        return {
          type: 'memory',
          connected: false,
          size: this.memoryCache.size,
          timers: this.cacheTimers.size
        };
      }
    } catch (error) {
      return {
        type: 'error',
        connected: false,
        error: error.message
      };
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnect();
      }
      
      // Clean up memory cache
      if (this.cacheTimers) {
        for (const timer of this.cacheTimers.values()) {
          clearTimeout(timer);
        }
      }
      
      this.isConnected = false;
      logger.info('Cache service disconnected');
    } catch (error) {
      logger.warn('Cache disconnect error:', error.message);
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
