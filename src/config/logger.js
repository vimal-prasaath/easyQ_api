

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(logColors);

// Create logs directory
const logsDir = path.join(__dirname, '../../logs');

// Format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Format for console logging
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Create different transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: consoleFormat
  }),

  // Error logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),

  // Combined logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),

  // HTTP logs
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '7d',
    zippedArchive: true
  })
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: logLevels,
  format: fileFormat,
  transports,
  exitOnError: false,
});

// Create specialized loggers for different modules
export const authLogger = logger.child({ module: 'AUTH' });
export const dbLogger = logger.child({ module: 'DATABASE' });
export const apiLogger = logger.child({ module: 'API' });
export const hospitalLogger = logger.child({ module: 'HOSPITAL' });
export const doctorLogger = logger.child({ module: 'DOCTOR' });
export const appointmentLogger = logger.child({ module: 'APPOINTMENT' });
export const qrLogger = logger.child({ module: 'QR_GENERATOR' });
export const uploadLogger = logger.child({ module: 'FILE_UPLOAD' });
export const searchLogger = logger.child({ module: 'SEARCH' });
export const reviewLogger = logger.child({ module: 'REVIEW' });

// Enhanced logging methods
export const logError = (error, context = {}) => {
  logger.error({
    message: error.message || error,
    stack: error.stack,
    ...context
  });
};

export const logWarn = (message, context = {}) => {
  logger.warn({
    message,
    ...context
  });
};

export const logInfo = (message, context = {}) => {
  logger.info({
    message,
    ...context
  });
};

export const logHttp = (req, res, responseTime) => {
  logger.http({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userId: req.user?.userId || 'anonymous'
  });
};

export const logDebug = (message, context = {}) => {
  logger.debug({
    message,
    ...context
  });
};

// Performance logging
export const logPerformance = (operation, duration, context = {}) => {
  logger.info({
    message: `Performance: ${operation} completed`,
    duration: `${duration}ms`,
    ...context
  });
};

// Database operation logging
export const logDatabaseOperation = (operation, collection, query = {}, result = {}) => {
  dbLogger.debug({
    message: `Database ${operation}`,
    collection,
    query: JSON.stringify(query),
    resultCount: result.length || (result.acknowledged ? 1 : 0)
  });
};

// API request/response logging
export const logApiRequest = (req, additionalInfo = {}) => {
  apiLogger.info({
    message: 'API Request',
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || 'anonymous',
    ...additionalInfo
  });
};

export const logApiResponse = (req, res, responseData = null, additionalInfo = {}) => {
  apiLogger.info({
    message: 'API Response',
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    userId: req.user?.userId || 'anonymous',
    responseSize: responseData ? JSON.stringify(responseData).length : 0,
    ...additionalInfo
  });
};

export default logger;