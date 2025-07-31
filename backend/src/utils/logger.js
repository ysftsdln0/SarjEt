const winston = require('winston');
const path = require('path');
const { getLocalIPAddress, getHostname, getPlatform } = require('./networkUtils');

// Get system information
const LOCAL_IP = getLocalIPAddress();
const HOSTNAME = getHostname();
const PLATFORM = getPlatform();

// Define log format with IP information
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const systemInfo = {
      localIP: LOCAL_IP,
      hostname: HOSTNAME,
      platform: PLATFORM
    };
    
    const logEntry = {
      timestamp,
      level,
      message,
      service,
      system: systemInfo,
      ...meta
    };
    
    return JSON.stringify(logEntry, null, 2);
  })
);

// Define log levels and colors
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  debug: 'green'
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'sarjet-backend' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const ipInfo = `[${LOCAL_IP}]`;
        const serviceInfo = service ? `[${service}]` : '';
        const metaInfo = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${ipInfo} ${serviceInfo} ${level}: ${message}${metaInfo}`;
      })
    )
  }));
}

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = logger;
