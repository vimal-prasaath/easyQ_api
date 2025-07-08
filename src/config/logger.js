import winston from 'winston';
import 'winston-daily-rotate-file'; 

const { combine, timestamp, printf, colorize } = winston.format;

// Define custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  // If a stack trace exists (for errors), include it
  if (stack) {
    return `${timestamp} ${level}: ${message}\n${stack}`;
  }
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Log level based on environment
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console Transport (for all environments)
    new winston.transports.Console({
      format: combine(
        colorize(), // Add colors for console output
        logFormat
      ),
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    // File Transport (for production/persistent logging)
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log', // Log file name with date
      datePattern: 'YYYY-MM-DD', // Daily rotation
      zippedArchive: true, // Zip old log files
      maxSize: '20m', // Max size of a log file before rotation
      maxFiles: '14d', // Retain logs for 14 days
      level: 'info', // Log info and above to file
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    // Error Log File (specific for errors)
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error', // Only log errors to this file
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ],
  // Exit on unhandled exceptions (optional, but good for production)
  // handled by process.on('uncaughtException') in app.js
  exitOnError: false,
});

// If not in production, log to console for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export default logger;