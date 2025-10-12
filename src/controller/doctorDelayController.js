import { DoctorDelayService } from '../services/doctorDelayService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';

/**
 * Set a delay for a doctor
 * POST /api/doctor/delay
 */
export const setDelay = async (req, res, next) => {
    try {
        const { doctorId, date, startTime, durationMinutes, reason } = req.body;
        const createdBy = req.user?.userId || 'system';

        // Validate required fields
        if (!doctorId || !date || !startTime || !durationMinutes || !reason) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Required fields: doctorId, date, startTime, durationMinutes, reason'
            );
        }

        const result = await DoctorDelayService.setDelay(doctorId, {
            date,
            startTime,
            durationMinutes,
            reason,
            createdBy
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Delay set successfully',
            data: result
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/doctor/delay',
            doctorId: req.body?.doctorId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to set delay'
        ));
    }
};

/**
 * Get active delays for a doctor
 * GET /api/doctor/delay/{doctorId}
 */
export const getDelays = async (req, res, next) => {
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

        const delays = await DoctorDelayService.getActiveDelays(doctorId, date);

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Delays retrieved successfully',
            data: {
                doctorId,
                delays,
                count: delays.length
            }
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/doctor/delay',
            doctorId: req.params?.doctorId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to get delays'
        ));
    }
};

/**
 * Clear delays for a doctor
 * DELETE /api/doctor/delay/{doctorId}
 */
export const clearDelays = async (req, res, next) => {
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

        const result = await DoctorDelayService.clearDelays(doctorId, date);

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Delays cleared successfully',
            data: result
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/doctor/delay',
            doctorId: req.params?.doctorId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to clear delays'
        ));
    }
};

/**
 * Reset all doctor availability (end of day)
 * POST /api/doctor/reset-availability
 */
export const resetAvailability = async (req, res, next) => {
    try {
        const { doctorId } = req.body || {};

        const result = await DoctorDelayService.resetAvailability(doctorId);

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Doctor availability reset successfully',
            data: result
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/doctor/reset-availability',
            doctorId: req.body?.doctorId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to reset availability'
        ));
    }
};

/**
 * Get adjusted appointment time considering delays
 * POST /api/doctor/adjusted-time
 */
export const getAdjustedTime = async (req, res, next) => {
    try {
        const { doctorId, appointmentDate, originalTime } = req.body;

        if (!doctorId || !appointmentDate || !originalTime) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Required fields: doctorId, appointmentDate, originalTime'
            );
        }

        const result = await DoctorDelayService.getAdjustedTime(
            doctorId, 
            new Date(appointmentDate), 
            originalTime
        );

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Adjusted time calculated',
            data: result
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/doctor/adjusted-time',
            doctorId: req.body?.doctorId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to calculate adjusted time'
        ));
    }
};
