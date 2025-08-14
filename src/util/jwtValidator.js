import { compareToken } from "./tokenGenerator.js";
import { EasyQError } from "../config/error.js";
import { httpStatusCode } from "./statusCode.js";
import { authLogger } from "../config/logger.js";
import User from "../model/userProfile.js";
import AdminProfile from "../model/adminProfile.js";

/**
 * Modularized JWT token validation utility
 * Handles both admin and user token validation
 */
export async function validateJWTToken(token, req, next) {
    try {
        const decodedPayload = await compareToken(token);
        
        // Debug: Log the token structure for troubleshooting
        authLogger.debug('JWT Token structure:', {
            hasData: !!decodedPayload.data,
            dataKeys: decodedPayload.data ? Object.keys(decodedPayload.data) : [],
            role: decodedPayload.data?.role,
            userId: decodedPayload.data?.userId,
            path: req.path
        });
        
        // Check if it's an admin token
        if (decodedPayload.data && decodedPayload.data.role === 'admin') {
            return await validateAdminToken(decodedPayload, req, next);
        } else {
            return await validateUserToken(decodedPayload, req, next);
        }
    } catch (error) {
        return handleJWTError(error, token, req, next);
    }
}

/**
 * Validate admin JWT token
 */
async function validateAdminToken(decodedPayload, req, next) {
    try {
        // For admin tokens, userId contains the adminId (e.g., "A0001")
        const adminFromDb = await AdminProfile.findOne({ adminId: decodedPayload.data.userId });
        if (!adminFromDb) {
            authLogger.error('Authorization failed: Authenticated admin not found in DB.', { 
                adminId: decodedPayload.data.userId, 
                path: req.path 
            });
            return next(new EasyQError(
                'AuthenticationError', 
                httpStatusCode.UNAUTHORIZED, 
                true, 
                'Authenticated admin not found.'
            ));
        }

        req.user = decodedPayload;
        req.isActive = adminFromDb.isActive;

        authLogger.info('Admin authenticated successfully', {
            adminId: decodedPayload.data.userId, // This is the adminId from token
            email: decodedPayload.data.email,
            role: decodedPayload.data.role,
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        return true; // Success
    } catch (error) {
        return handleJWTError(error, null, req, next);
    }
}

/**
 * Validate user JWT token
 */
async function validateUserToken(decodedPayload, req, next) {
    try {
        const userFromDb = await User.findOne({ userId: decodedPayload.data.userId }).select('isActive');
        if (!userFromDb) {
            authLogger.error('Authorization failed: Authenticated user not found in DB.', { 
                userId: decodedPayload.data.userId, 
                path: req.path 
            });
            return next(new EasyQError(
                'AuthenticationError', 
                httpStatusCode.UNAUTHORIZED, 
                true, 
                'Authenticated user not found.'
            ));
        }

        req.user = decodedPayload;
        req.isActive = userFromDb.isActive;

        authLogger.info('User authenticated successfully', {
            userId: decodedPayload.data.userId,
            email: decodedPayload.data.email,
            role: decodedPayload.data.role,
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        return true; // Success
    } catch (error) {
        return handleJWTError(error, null, req, next);
    }
}

/**
 * Handle JWT validation errors
 */
function handleJWTError(error, token, req, next) {
    authLogger.error('Authentication failed: Token validation error', {
        errorName: error.name,
        errorMessage: error.message,
        path: req.path,
        method: req.method,
        ip: req.ip,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'N/A'
    });

    if (error.name === 'TokenExpiredError') {
        return next(new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            'Authentication failed: Token expired.'
        ));
    }
    if (error.name === 'JsonWebTokenError') {
        return next(new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            'Authentication failed: Invalid token.'
        ));
    }
    return next(error);
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return { success: false, error: 'Authorization header is missing' };
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return { success: false, error: 'Invalid Authorization header format' };
    }

    return { success: true, token: tokenParts[1] };
}

/**
 * Validate token format and extract
 */
export function validateAndExtractToken(req, next) {
    const result = extractTokenFromHeader(req);
    
    if (!result.success) {
        return next(new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            result.error
        ));
    }

    return result.token;
}

/**
 * Test function to verify JWT validation (for development/testing)
 */
export function testJWTValidation() {
    console.log('✅ JWT Validator module loaded successfully');
    console.log('📋 Available functions:');
    console.log('  - validateJWTToken(token, req, next)');
    console.log('  - extractTokenFromHeader(req)');
    console.log('  - validateAndExtractToken(req, next)');
    console.log('  - testJWTValidation()');
    return true;
}
