import jwt from 'jsonwebtoken';
import Doctor from '../model/doctor.js';
import Nurse from '../model/nurse.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logError } from '../config/logger.js';

const STAFF_TYPES = ['doctor', 'nurse'];

export const authenticateStaff = async (req, res, next) => {
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

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type === 'refresh' || !STAFF_TYPES.includes(decoded.type)) {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid token type. Doctor or nurse access token required.'
            );
        }

        if (!decoded.data || !STAFF_TYPES.includes(decoded.data.role)) {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid token. Doctor or nurse access required.'
            );
        }

        const role = decoded.data.role;
        const userId = decoded.data.userId;
        let user;

        if (role === 'doctor') {
            user = await Doctor.findOne({ doctorId: userId, isPasswordSet: true });
        } else {
            user = await Nurse.findOne({ nurseId: userId, isPasswordSet: true });
        }

        if (!user) {
            throw new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'User not found or account not activated.'
            );
        }

        req.user = {
            data: {
                userId,
                role
            }
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(new EasyQError(
                'UnauthorizedError',
                httpStatusCode.UNAUTHORIZED,
                true,
                error.name === 'TokenExpiredError'
                    ? 'Access token has expired.'
                    : 'Invalid access token.'
            ));
        }

        logError('Staff authentication error', {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
};
