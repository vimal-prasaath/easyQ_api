
import rateLimit from 'express-rate-limit';
import { logWarn } from '../config/logger.js';

/**
 * General API rate limiting
 */
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
        logWarn('Rate limit exceeded', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            userAgent: req.get('User-Agent'),
            limit: options.max,
            windowMs: options.windowMs
        });
        res.status(options.statusCode).json(options.message);
    }
});

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logWarn('Authentication rate limit exceeded', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            email: req.body?.email,
            limit: options.max,
            windowMs: options.windowMs
        });
        res.status(options.statusCode).json(options.message);
    }
});

/**
 * Moderate rate limiting for search endpoints
 */
export const searchRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 search requests per minute
    message: {
        error: 'Too many search requests, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logWarn('Search rate limit exceeded', {
            ip: req.ip,
            url: req.originalUrl,
            method: req.method,
            userId: req.user?.userId,
            limit: options.max,
            windowMs: options.windowMs
        });
        res.status(options.statusCode).json(options.message);
    }
});

export default { generalRateLimit, authRateLimit, searchRateLimit };
