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

    let decodedFirebase;
    try {
        decodedFirebase = await admin.auth().verifyIdToken(token);
    } catch (firebaseErr) {
        authLogger.warn('Firebase ID Token verification failed, attempting custom JWT verification.', {
            errorName: firebaseErr.name,
            errorMessage: firebaseErr.message,
            errorCode: firebaseErr.code,
            path: req.path,
            tokenPreview: token.substring(0, 20) + '...'
        });

        try {
            const decodedPayload = await compareToken(token);

            const userFromDb = await User.findOne({ userId: decodedPayload.data.userId }).select('isActive');
            if (!userFromDb) {
                authLogger.error('Authorization failed: Authenticated user not found in DB.', { userId: decodedPayload.data.userId, path: req.path });
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
            return next();
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
            return next(error);
        }
    }

    try {
        let userFromDb = await User.findOne({ phoneNumber: decodedFirebase.phone_number });
        if (!userFromDb) {
            const newUser = await User.create({
                phoneNumber: decodedFirebase.phone_number,
                isActive: true,
                profileUpdate: false,
            });
            userFromDb = newUser;
            authLogger.info('New user created from Firebase login.', { userId: newUser.userId });
        }
        req.user = { ...decodedFirebase, role: 'user' };
        req.isActive = userFromDb.isActive;
        authLogger.info('Token verified successfully by Firebase Admin SDK', {
            userId: decodedFirebase.uid,
            email: decodedFirebase.email,
            path: req.path
        });
        next();
    } catch (dbErr) {
        if (dbErr.code === 11000) {
            authLogger.error('User persistence conflict after Firebase auth', {
                keyPattern: dbErr.keyPattern,
                keyValue: dbErr.keyValue,
                path: req.path
            });
            return next(new EasyQError(
                'ConflictError',
                httpStatusCode.CONFLICT,
                true,
                'A user record conflict occurred. If this persists, contact support.'
            ));
        }
        return next(dbErr);
    }
}

export default authenticate;
