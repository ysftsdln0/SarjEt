const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ChargingStationService {
  constructor() {
    this.apiKey = process.env.OPENCHARGE_MAP_API_KEY;
    this.baseUrl = 'https://api.openchargemap.io/v3/poi';
    this.cacheDir = path.join(__dirname, '../../cache');
    this.cacheFile = path.join(this.cacheDir, 'charging-stations.json');
    this.metadataFile = path.join(this.cacheDir, 'cache-metadata.json');
    
    // Cache ayarları (1 gün = 24 saat)
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 saat ms cinsinden
    
    this.stations = new Map();
    this.isLoaded = false;

    // Yakın istasyon sonuçları için bellek içi cache (TTL: 10 dakika)
    this.nearbyCache = new Map(); // key -> { data, expiresAt }
    this.nearbyCacheTtlMs = 10 * 60 * 1000;

    // Son güncelleme zamanı
    this.lastUpdated = null;
    
    this.init();

    // Cron-like periodic refresh once per day (simple timer; better with node-cron)
    const dailyMs = 24 * 60 * 60 * 1000;
    setInterval(() => {
      this.refreshCache().catch(() => {});
    }, dailyMs);
  }

  async init() {
    try {
      await this.ensureCacheDir();
      await this.loadFromCache();
      
      if (!this.isLoaded || await this.isCacheExpired()) {
        logger.info('Cache expired or empty, fetching from OpenChargeMap API...');
        await this.fetchAndCacheStations();
      } else {
        logger.info(`Charging stations loaded from cache: ${this.stations.size} stations`);
      }
    } catch (error) {
      logger.error('Failed to initialize ChargingStationService:', error);
    }
  }

  async ensureCacheDir() {
    try {
      await fs.access(this.cacheDir);
    } catch (error) {
      await fs.mkdir(this.cacheDir, { recursive: true });
      logger.info('Cache directory created');
    }
  }

  async isCacheExpired() {
    try {
      const metadata = await fs.readFile(this.metadataFile, 'utf8');
      const { lastUpdated } = JSON.parse(metadata);
      const now = Date.now();
      
      return (now - lastUpdated) > this.cacheExpiry;
    } catch (error) {
      return true; // Cache yoksa expired sayalım
    }
  }

  async loadFromCache() {
    try {
      const cacheData = await fs.readFile(this.cacheFile, 'utf8');
      const stations = JSON.parse(cacheData);
      
      this.stations.clear();
      stations.forEach(station => {
        this.stations.set(station.ID, station);
      });

      // Metadata'dan lastUpdated'ı oku
      try {
        const metadataRaw = await fs.readFile(this.metadataFile, 'utf8');
        const metadata = JSON.parse(metadataRaw);
        this.lastUpdated = metadata.lastUpdated || null;
      } catch {
        this.lastUpdated = null;
      }
      
      this.isLoaded = true;
      logger.info(`Loaded ${this.stations.size} stations from cache`);
    } catch (error) {
      logger.warn('Could not load from cache, will fetch fresh data');
      this.isLoaded = false;
    }
  }

  async fetchAndCacheStations() {
    try {
      if (this._refreshInFlight) {
        logger.info('Cache refresh already in flight, skipping');
        return;
      }
      this._refreshInFlight = true;
      logger.info('Fetching charging stations from OpenChargeMap API...');
      
      // Türkiye için şarj istasyonları çek (Turkey country code: TR)
      const params = {
        output: 'json',
        countrycode: 'TR',
        maxresults: 10000, // Maksimum sonuç sayısı
        compact: true,
        verbose: false,
        key: this.apiKey
      };

      const response = await axios.get(this.baseUrl, { 
        params,
        timeout: 30000 // 30 saniye timeout
      });

      const stations = response.data;
      logger.info(`Fetched ${stations.length} stations from API`);

      // Process ve normalize et
      const processedStations = stations.map(station => this.processStation(station));

      // Cache'e kaydet
      await this.saveToCache(processedStations);
      
      // Memory'ye yükle
      this.stations.clear();
      processedStations.forEach(station => {
        this.stations.set(station.ID, station);
      });

      // Yakın istasyon cache'ini temizle (veri güncellendi)
      this.nearbyCache.clear();

      this.isLoaded = true;
      logger.info(`Successfully cached ${processedStations.length} charging stations`);

    } catch (error) {
      logger.error('Failed to fetch stations from API:', error.message);
      
      // API başarısız olursa cache'den yükle
      if (!this.isLoaded) {
        await this.loadFromCache();
      }
    } finally {
      this._refreshInFlight = false;
    }
  }

  processStation(rawStation) {
    return {
      ID: rawStation.ID,
      UUID: rawStation.UUID,
      DataProviderID: rawStation.DataProviderID,
      OperatorID: rawStation.OperatorID,
      UsageTypeID: rawStation.UsageTypeID,
      AddressInfo: {
        ID: rawStation.AddressInfo?.ID,
        Title: rawStation.AddressInfo?.Title || 'Unknown Station',
        AddressLine1: rawStation.AddressInfo?.AddressLine1,
        Town: rawStation.AddressInfo?.Town,
        StateOrProvince: rawStation.AddressInfo?.StateOrProvince,
        Postcode: rawStation.AddressInfo?.Postcode,
        CountryID: rawStation.AddressInfo?.CountryID,
        Latitude: rawStation.AddressInfo?.Latitude,
        Longitude: rawStation.AddressInfo?.Longitude,
        Distance: rawStation.AddressInfo?.Distance,
        DistanceUnit: rawStation.AddressInfo?.DistanceUnit
      },
      Connections: rawStation.Connections?.map(conn => ({
        ID: conn.ID,
        ConnectionTypeID: conn.ConnectionTypeID,
        StatusTypeID: conn.StatusTypeID,
        LevelID: conn.LevelID,
        PowerKW: conn.PowerKW,
        CurrentTypeID: conn.CurrentTypeID,
        Quantity: conn.Quantity || 1
      })) || [],
      NumberOfPoints: rawStation.NumberOfPoints || 1,
      GeneralComments: rawStation.GeneralComments,
      DatePlanned: rawStation.DatePlanned,
      DateLastConfirmed: rawStation.DateLastConfirmed,
      StatusTypeID: rawStation.StatusTypeID,
      SubmissionStatusTypeID: rawStation.SubmissionStatusTypeID,
      UserComments: rawStation.UserComments || [],
      PercentageSimilarity: rawStation.PercentageSimilarity,
      MediaItems: rawStation.MediaItems || [],
      IsRecentlyVerified: rawStation.IsRecentlyVerified,
      DateLastVerified: rawStation.DateLastVerified,
      // Ek SarjEt alanları
      processed: true,
      cachedAt: new Date().toISOString()
    };
  }

  async saveToCache(stations) {
    try {
      // Stations'ı kaydet
      await fs.writeFile(this.cacheFile, JSON.stringify(stations, null, 2));
      
      // Metadata kaydet
      const metadata = {
        lastUpdated: Date.now(),
        stationCount: stations.length,
        version: '1.0.0'
      };
      await fs.writeFile(this.metadataFile, JSON.stringify(metadata, null, 2));

      // Hafızada lastUpdated'ı güncelle
      this.lastUpdated = metadata.lastUpdated;
      
      logger.info('Successfully saved stations to cache');
    } catch (error) {
      logger.error('Failed to save cache:', error);
    }
  }

  // Yakın istasyonlar için cache key üret
  _buildNearbyCacheKey(latitude, longitude, radiusKm, limit) {
    const round = (n) => Math.round(n * 1000) / 1000; // ~110m çözünürlük
    return `${round(latitude)}:${round(longitude)}:r${radiusKm}:l${limit}`;
  }

  // Koordinatlara göre yakın istasyonları bul
  findNearbyStations(latitude, longitude, radiusKm = 50, limit = 20) {
    const cacheKey = this._buildNearbyCacheKey(latitude, longitude, radiusKm, limit);
    const now = Date.now();

    // Cache kontrolü
    const cached = this.nearbyCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const nearby = [];
    
    for (const station of this.stations.values()) {
      if (!station.AddressInfo?.Latitude || !station.AddressInfo?.Longitude) {
        continue;
      }
      
      const distance = this.calculateDistance(
        latitude, longitude,
        station.AddressInfo.Latitude, station.AddressInfo.Longitude
      );
      
      if (distance <= radiusKm) {
        nearby.push({
          ...station,
          distance: Math.round(distance * 10) / 10 // 1 ondalık basamak
        });
      }
    }
    
    // Mesafeye göre sırala ve limit uygula
    const result = nearby
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    // Cache'e yaz
    this.nearbyCache.set(cacheKey, {
      data: result,
      expiresAt: now + this.nearbyCacheTtlMs,
    });

    return result;
  }

  // Şehre göre istasyonları bul
  findStationsByCity(cityName, limit = 50) {
    const stations = [];
    
    for (const station of this.stations.values()) {
      const town = station.AddressInfo?.Town?.toLowerCase();
      if (town && town.includes(cityName.toLowerCase())) {
        stations.push(station);
      }
    }
    
    return stations.slice(0, limit);
  }

  // İstasyon ID'ye göre detay getir
  getStationById(stationId) {
    return this.stations.get(parseInt(stationId));
  }

  // Tüm istasyonları getir (sayfalama ile)
  getAllStations(page = 1, limit = 50) {
    const stations = Array.from(this.stations.values());
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      stations: stations.slice(startIndex, endIndex),
      total: stations.length,
      page,
      limit,
      hasMore: endIndex < stations.length
    };
  }

  // İstatistikler
  getStats() {
    const total = this.stations.size;
    const cities = new Set();
    const operators = new Set();
    let totalConnections = 0;
    
    for (const station of this.stations.values()) {
      if (station.AddressInfo?.Town) {
        cities.add(station.AddressInfo.Town);
      }
      if (station.OperatorID) {
        operators.add(station.OperatorID);
      }
      totalConnections += station.Connections?.length || 0;
    }
    
    return {
      totalStations: total,
      totalCities: cities.size,
      totalOperators: operators.size,
      totalConnections,
      lastUpdate: this.lastUpdated ? new Date(this.lastUpdated).toISOString() : null
    };
  }

  // Manuel refresh
  async refreshCache() {
    logger.info('Manual cache refresh initiated');
    await this.fetchAndCacheStations();
  }

  // Haversine distance formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

// Singleton instance
const chargingStationService = new ChargingStationService();

module.exports = chargingStationService;
