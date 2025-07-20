import { compareToken } from "../util/tokenGenerator.js";
import { EasyQError } from "../config/error.js"
import { httpStatusCode } from "../util/statusCode.js";
import { authLogger } from "../config/logger.js";
import User from "../model/userProfile.js"
import admin from '../config/firebaseAdmin.js'
async function authenticate(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        authLogger.warn('Authentication failed: Missing authorization header', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        return next(new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            'Authorization header is missing. Please provide a JWT.'
        ));
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        authLogger.warn('Authentication failed: Invalid authorization header format', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            authHeader: authHeader.substring(0, 20) + '...'
        });
        return next(new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            'Invalid Authorization header format. Must be "Bearer <token>".'
        ));
    }

    const token = tokenParts[1];
    let decodedPayload = null;

    try {
        // --- Attempt Firebase ID Token verification first ---
        decodedPayload = await admin.auth().verifyIdToken(token);

        let userFromDb = await User.findOne({ userId: decodedPayload.email, }).select('isActive');
        if (!userFromDb) {
            authLogger.error('Authorization failed: Authenticated user not found in DB.', { userId: authenticatedUserId, path: req.path });
            return next(new EasyQError('AuthenticationError', httpStatusCode.UNAUTHORIZED, true, 'Authenticated user not found.'));
        }
        req.user = decodedPayload;
        req.isActive = userFromDb.isActive;

        authLogger.info('Token verified successfully by Firebase Admin SDK', {
            userId: decodedPayload.uid,
            email: decodedPayload.email,
            path: req.path
        });
        next()
    } catch (firebaseError) {
        authLogger.warn('Firebase ID Token verification failed, attempting custom JWT verification.', {
            errorName: firebaseError.name,
            errorMessage: firebaseError.message,
            errorCode: firebaseError.code,
            path: req.path,
            tokenPreview: token.substring(0, 20) + '...'
        });
    }



    try {
        const decodedPayload = await compareToken(token);

        let userFromDb = await User.findOne({ userId: decodedPayload.data.userId, }).select('isActive');
        if (!userFromDb) {
            authLogger.error('Authorization failed: Authenticated user not found in DB.', { userId: authenticatedUserId, path: req.path });
            return next(new EasyQError('AuthenticationError', httpStatusCode.UNAUTHORIZED, true, 'Authenticated user not found.'));
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

        next();
    } catch (error) {
        authLogger.error('Authentication failed: Token validation error', {
            errorName: error.name,
            errorMessage: error.message,
            path: req.path,
            method: req.method,
            ip: req.ip,
            tokenPreview: token.substring(0, 20) + '...'
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
        next(error);
    }
}

export default authenticate;
