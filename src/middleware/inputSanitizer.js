
import validator from 'validator';
import { logWarn } from '../config/logger.js';


export const sanitizeInput = (req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }

        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }

        next();
    } catch (error) {
        logWarn('Input sanitization error', {
            error: error.message,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
        next(error);
    }
};


function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => 
            typeof item === 'object' ? sanitizeObject(item) : sanitizeString(item)
        );
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const sanitizedKey = sanitizeString(key);
            if (typeof value === 'object' && value !== null) {
                sanitized[sanitizedKey] = sanitizeObject(value);
            } else {
                sanitized[sanitizedKey] = sanitizeString(value);
            }
        }
        return sanitized;
    }

    return sanitizeString(obj);
}

function sanitizeString(value) {
    if (typeof value !== 'string') {
        return value;
    }

    // Remove potential XSS
    let sanitized = validator.escape(value);
    
    // Remove SQL injection patterns
    sanitized = sanitized.replace(/['";\\]/g, '');
    
    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Normalize whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
}

/**
 * Normalize input data
 */
export const normalizeInput = (req, res, next) => {
    try {
        // Normalize email fields
        if (req.body?.email) {
            req.body.email = req.body.email.toLowerCase().trim();
        }

        // Normalize phone numbers (remove non-digits)
        if (req.body?.phoneNumber) {
            req.body.phoneNumber = req.body.phoneNumber.replace(/\D/g, '');
        }
        if (req.body?.mobileNumber) {
            req.body.mobileNumber = req.body.mobileNumber.replace(/\D/g, '');
        }

        // Normalize names (proper case)
        if (req.body?.name) {
            req.body.name = req.body.name.trim().replace(/\s+/g, ' ');
        }

        // Normalize boolean strings
        for (const [key, value] of Object.entries(req.body || {})) {
            if (typeof value === 'string') {
                if (value.toLowerCase() === 'true') {
                    req.body[key] = true;
                } else if (value.toLowerCase() === 'false') {
                    req.body[key] = false;
                }
            }
        }

        next();
    } catch (error) {
        logWarn('Input normalization error', {
            error: error.message,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip
        });
        next(error);
    }
};

export default { sanitizeInput, normalizeInput };





