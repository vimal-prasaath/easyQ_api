import app from './app.js';
import { dbConnect } from './config/dbConnect.js';
import { EasyQError } from './config/error.js';
import { httpStatusCode } from './util/statusCode.js';
import { logInfo, logError } from './config/logger.js';
import dotenv from 'dotenv';

const PORT = process.env.PORT || 3000;

dotenv.config();

dbConnect().then(() => {
  app.listen(PORT, () => {
    logInfo(`🚀 EasyQ API Server started successfully`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      url: `http://localhost:${PORT}`,
      apiDocs: `http://localhost:${PORT}/api-docs`
    });
  });
}).catch((err) => {
  logError('CRITICAL ERROR: Failed to connect to DB and start server', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logError('UNHANDLED REJECTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logError('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});
