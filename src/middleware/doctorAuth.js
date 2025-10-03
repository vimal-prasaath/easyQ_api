import jwt from 'jsonwebtoken';
import Doctor from '../model/doctor.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logError } from '../config/logger.js';

export const authenticateDoctor = async (req, res, next) => {
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
        
        // Check if token is for doctor type
        if (decoded.type !== 'doctor' || !decoded.data || decoded.data.role !== 'doctor') {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid token type. Doctor token required.'
            );
        }

        // Check if doctor exists and is active
        const doctor = await Doctor.findOne({ 
            doctorId: decoded.data.userId,
            isPasswordSet: true 
        });

        if (!doctor) {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Doctor not found or account not activated.'
            );
        }

        // Add doctor info to request
        req.user = {
            doctorId: doctor.doctorId,
            email: doctor.email,
            name: doctor.name,
            hospitalId: doctor.hospitalId,
            permissions: doctor.permissions,
            data: {
                userId: doctor.doctorId,
                role: 'doctor'
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

        logError('Doctor authentication error', {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
};

export const checkDoctorPermission = (permission) => {
    return (req, res, next) => {
        try {
            if (!req.user || !req.user.permissions) {
                throw new EasyQError(
                    'UnauthorizedError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Doctor permissions not found.'
                );
            }

            const doctorPermissions = req.user.permissions;
            const permissionConfig = doctorPermissions[permission];

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
            logError('Doctor permission check error', {
                error: error.message,
                permission,
                doctorId: req.user?.doctorId
            });
            next(error);
        }
    };
};
