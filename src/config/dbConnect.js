import mongoose from "mongoose";
import { dbLogger, logInfo, logError } from './logger.js';

const MONGO_URL = process.env.MONGO_URI;

export const dbConnect = async () => {
    try {
        await mongoose.connect(MONGO_URL, {
            dbName: "easyQ_test",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
            connectTimeoutMS: 10000, // 10 seconds timeout
            socketTimeoutMS: 10000, // 10 seconds timeout
        });
        
        dbLogger.info("✅ Database connected successfully!", {
            url: MONGO_URL,
            database: "easyQ_test"
        });

        // Log database connection events
        mongoose.connection.on('disconnected', () => {
            dbLogger.warn('📦 Database disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            dbLogger.info('🔄 Database reconnected');
        });

        mongoose.connection.on('error', (err) => {
            dbLogger.error('❌ Database connection error', {
                error: err.message,
                stack: err.stack
            });
        });

    } catch (error) {
        dbLogger.error("❌ Database connection failed!", {
            error: error.message,
            stack: error.stack,
            url: MONGO_URL
        });
        throw error;
    }
};
