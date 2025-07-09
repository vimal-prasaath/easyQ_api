import jwt from 'jsonwebtoken'
import { httpStatusCode } from './statusCode.js';
import { EasyQError } from '../config/error.js';
export async function TokenGenerator(data) {
    try {
        const secret = process.env.JWT_SECRET || 'secret';
        const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
        // Math.floor(Date.now() / 1000) + (60 * 60)
        //  const token=jwt.sign({ exp: expiresIn ,data: data}, secret);
        const token = jwt.sign({ data: data }, secret, { expiresIn: expiresIn });
        return token
    } catch (error) {
        throw new EasyQError(
            'TokenGenerationError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to generate authentication token: ${error.message}`
        );
    };
}

export async function compareToken(token) {
    try {
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded = jwt.verify(token, secret)
        return decoded
    } catch (e) {
        let errorMessage = 'Invalid or expired token.';
        let statusCode = httpStatusCode.UNAUTHORIZED;
        let isOperational = true; 
        let errorName = 'TokenVerificationError';
          if (e.name === 'TokenExpiredError') {
            errorMessage = 'Authentication token has expired. Please log in again.';
            errorName = 'TokenExpiredError';
        } else if (e.name === 'JsonWebTokenError') {
            errorMessage = 'Invalid authentication token. Please provide a valid token.';
            errorName = 'JsonWebTokenError';
        }

        throw new EasyQError(
            errorName,
            statusCode,
            isOperational,
            errorMessage
        )
    }
}