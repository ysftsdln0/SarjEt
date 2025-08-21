const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

// Load environment variables from root .env
require('dotenv').config({ path: '../.env' });

// Import routes
const authRoutes = require('./routes/auth');
const stationRoutes = require('./routes/stations');
const vehicleRoutes = require('./routes/vehicles');
const routeRoutes = require('./routes/routes');
const userRoutes = require('./routes/users');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { auth } = require('./middleware/auth');
const logger = require('./utils/logger');
const { getLocalIPAddress, getNetworkInterfaces } = require('./utils/networkUtils');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(compression()); // Compress responses
app.use(helmet()); // Security headers
// CORS origins from env (comma-separated), fallback to common dev ports
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:19006',
  'http://localhost:8081',
  'http://localhost:8082'
];

app.use(cors({
  origin: corsOrigins.length ? corsOrigins : defaultOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Make Prisma available in requests
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const localIP = getLocalIPAddress();
  const networkInfo = getNetworkInterfaces();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    network: {
      localIP: localIP,
      hostname: require('os').hostname(),
      platform: require('os').platform(),
      interfaces: networkInfo
    },
    endpoints: {
      local: `http://localhost:${PORT}`,
      network: `http://${localIP}:${PORT}`,
      api: `http://${localIP}:${PORT}/api`
    }
  });
});

// Network info endpoint for frontend
app.get('/api/network-info', (req, res) => {
  const localIP = getLocalIPAddress();
  
  logger.info('Network info requested', {
    requestIP: req.ip,
    userAgent: req.get('User-Agent'),
    localIP: localIP
  });
  
  res.json({
    success: true,
    data: {
      backendIP: localIP,
      backendPort: PORT,
      baseURL: `http://${localIP}:${PORT}`,
      apiURL: `http://${localIP}:${PORT}/api`,
      timestamp: new Date().toISOString()
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/users', auth, userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`,
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  const localIP = getLocalIPAddress();
  const networkInterfaces = getNetworkInterfaces();
  
  logger.info(`🚀 SarjEt Backend API running on port ${PORT}`);
  logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Local IP Address: ${localIP}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 External access: http://${localIP}:${PORT}/health`);
  
  // Network interfaces detayları
  logger.info('📡 Available Network Interfaces:', { 
    interfaces: networkInterfaces,
    primaryIP: localIP
  });
  
  // Frontend bağlantı bilgileri
  logger.info(`📱 Frontend connection URLs:`);
  logger.info(`   - Local: http://localhost:${PORT}`);
  logger.info(`   - Network: http://${localIP}:${PORT}`);
  logger.info(`   - API Base: http://${localIP}:${PORT}/api`);
});

module.exports = app;
