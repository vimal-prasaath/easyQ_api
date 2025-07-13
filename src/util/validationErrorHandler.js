import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logWarn } from '../config/logger.js';

/**
 * Enhanced error handler for different types of errors
 */
export class ValidationErrorHandler {
    
    /**
     * Handle Mongoose validation errors
     */
    static handleValidationError(error) {
         if (!error.errors || typeof error.errors !== 'object') {
            return new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Validation failed: ${error.message || 'Invalid data provided.'}`
            );
        }
        const errors = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message,
            value: err.value,
            kind: err.kind
        }));

        const message = errors.map(e => `${e.field}: ${e.message}`).join(', ');
        
        return new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            `Validation failed: ${message}`,
            { errors }
        );
    }

    /**
     * Handle Mongoose duplicate key errors
     */
    static handleDuplicateKeyError(error) {
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];
        
        return new EasyQError(
            'DuplicateError',
            httpStatusCode.CONFLICT,
            true,
            `${field} '${value}' already exists. Please use a different ${field}.`
        );
    }

    /**
     * Handle Mongoose cast errors (invalid ObjectId, etc.)
     */
    static handleCastError(error) {
        return new EasyQError(
            'InvalidInputError',
            httpStatusCode.BAD_REQUEST,
            true,
            `Invalid ${error.path}: ${error.value}. Expected ${error.kind}.`
        );
    }

    /**
     * Handle JWT errors
     */
    static handleJWTError(error) {
        if (error.name === 'TokenExpiredError') {
            return new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Your session has expired. Please login again.'
            );
        }
        
        if (error.name === 'JsonWebTokenError') {
            return new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid authentication token. Please login again.'
            );
        }

        return new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            'Authentication failed. Please login again.'
        );
    }

    /**
     * Main error processing function
     */
    static processError(error, req = null) {
        // Log the error with context
        if (req) {
            logWarn('Error occurred', {
                error: error.message,
                name: error.name,
                code: error.code,
                path: req?.path,
                method: req?.method,
                userId: req?.user?.userId,
                ip: req?.ip
            });
        }

        // Handle specific error types
        if (error.name === 'ValidationError') {
            return this.handleValidationError(error);
        }

        if (error.code === 11000) {
            return this.handleDuplicateKeyError(error);
        }

        if (error.name === 'CastError') {
            return this.handleCastError(error);
        }

        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return this.handleJWTError(error);
        }

        // If it's already an EasyQError, return as is
        if (error instanceof EasyQError) {
            return error;
        }

        // Handle unexpected errors
        return new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            process.env.NODE_ENV === 'production' 
                ? 'An unexpected error occurred. Please try again later.'
                : error.message
        );
    }

    /**
     * Format error response for API
     */
    static formatErrorResponse(error) {
        return {
            status: 'error',
            name: error.name,
            message: error.description || error.message,
            ...(error.details && { details: error.details }),
            ...(process.env.NODE_ENV === 'development' && error.stack && { stack: error.stack })
        };
    }
}

export default ValidationErrorHandler;