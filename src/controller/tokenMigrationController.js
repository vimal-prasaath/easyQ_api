import { TokenAssignmentService } from '../services/tokenAssignmentService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';

/**
 * Migrate existing appointments to add token numbers
 * POST /api/token/migrate
 */
export const migrateTokens = async (req, res, next) => {
    try {
        const { doctorId } = req.body || {};
        
        logInfo('Token migration started', { 
            doctorId: doctorId || 'all',
            requestedBy: req.user?.userId || 'system'
        });

        const result = await TokenAssignmentService.migrateExistingAppointments(doctorId);

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Token migration completed',
            data: result
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/token/migrate',
            doctorId: req.body?.doctorId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to migrate tokens'
        ));
    }
};

/**
 * Get token statistics for a doctor
 * GET /api/token/stats/:doctorId
 */
export const getTokenStats = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;
        
        if (!doctorId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required'
            );
        }

        // Implementation for token statistics
        // This would show token distribution, slot usage, etc.
        
        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Token statistics retrieved',
            data: {
                doctorId,
                date: date || 'all',
                // Add actual statistics here
                note: 'Token statistics endpoint - implementation pending'
            }
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/token/stats',
            doctorId: req.params?.doctorId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to get token statistics'
        ));
    }
};
