import app from './app.js';
import { dbConnect } from './config/dbConnect.js';
import { EasyQError } from './config/error.js';
import { httpStatusCode } from './util/statusCode.js';
const PORT = process.env.PORT || 3000;
import dotenv from 'dotenv';

dotenv.config();
dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('CRITICAL ERROR: Failed to connect to DB and start server:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
})
