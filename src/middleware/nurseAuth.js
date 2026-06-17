import jwt from 'jsonwebtoken';
import Nurse from '../model/nurse.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logError } from '../config/logger.js';

export const authenticateNurse = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Access token is required.'
            );
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Access token is required.'
            );
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type === 'refresh') {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Refresh token cannot be used for API access. Please use a valid access token.'
            );
        }
        
        // Check if token is for nurse type
        if (decoded.type !== 'nurse' || !decoded.data || decoded.data.role !== 'nurse') {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid token type. Nurse token required.'
            );
        }

        // Check if nurse exists and is active
        const nurse = await Nurse.findOne({ 
            nurseId: decoded.data.userId,
            isPasswordSet: true 
        });

        if (!nurse) {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Nurse not found or account not activated.'
            );
        }

        // Add nurse info to request
        req.user = {
            nurseId: nurse.nurseId,
            email: nurse.email,
            name: nurse.name,
            hospitalId: nurse.hospitalId,
            permissions: nurse.permissions,
            data: {
                userId: nurse.nurseId,
                role: 'nurse'
            }
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            logError('Invalid JWT token', {
                error: error.message,
                token: req.headers.authorization?.substring(0, 20) + '...'
            });
            return next(new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid access token.'
            ));
        }

        if (error.name === 'TokenExpiredError') {
            logError('Expired JWT token', {
                error: error.message,
                token: req.headers.authorization?.substring(0, 20) + '...'
            });
            return next(new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Access token has expired.'
            ));
        }

        logError('Nurse authentication error', {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
};

export const checkNursePermission = (permission) => {
    return (req, res, next) => {
        try {
            if (!req.user || !req.user.permissions) {
                throw new EasyQError(
                    'UnauthorizedError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Nurse permissions not found.'
                );
            }

            const nursePermissions = req.user.permissions;
            const permissionConfig = nursePermissions[permission];

            if (!permissionConfig || !permissionConfig.enabled) {
                throw new EasyQError(
                    'ForbiddenError',
                    httpStatusCode.FORBIDDEN,
                    true,
                    `Access denied. You don't have permission to access ${permission}.`
                );
            }

            // Add permission info to request for further use
            req.permission = {
                name: permission,
                enabled: permissionConfig.enabled,
                viewOnly: permissionConfig.viewOnly
            };

            next();
        } catch (error) {
            logError('Nurse permission check error', {
                error: error.message,
                permission,
                nurseId: req.user?.nurseId
            });
            next(error);
        }
    };
};
