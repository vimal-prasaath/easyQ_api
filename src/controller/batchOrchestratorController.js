import { BatchOrchestrator } from '../services/batchOrchestrator.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';

/**
 * Manually trigger ETA-based batch processing
 * POST /api/orchestrator/batch/process-eta
 */
export const processETABatches = async (req, res, next) => {
    try {
        const result = await BatchOrchestrator.processETABasedNotifications();

        logInfo('Manual ETA batch processing triggered', {
            notificationsTriggered: result.notificationsTriggered
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: `ETA batch processing completed. ${result.notificationsTriggered} notifications triggered.`,
            data: result
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/orchestrator/batch/process-eta'
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to process ETA-based batches'
        ));
    }
};

/**
 * Manually trigger no-show detection
 * POST /api/orchestrator/batch/detect-noshow
 */
export const detectNoShows = async (req, res, next) => {
    try {
        const result = await BatchOrchestrator.handleNoShows();

        logInfo('Manual no-show detection triggered', {
            noShowsDetected: result.noShowsDetected
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: `No-show detection completed. ${result.noShowsDetected} no-shows detected.`,
            data: result
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/orchestrator/batch/detect-noshow'
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to detect no-shows'
        ));
    }
};

/**
 * Manually handle check-in event
 * POST /api/orchestrator/batch/checkin
 */
export const handleCheckIn = async (req, res, next) => {
    try {
        const { appointmentId } = req.body;

        if (!appointmentId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'appointmentId is required'
            );
        }

        const result = await BatchOrchestrator.handleCheckIn(appointmentId);

        logInfo('Manual check-in handled', {
            appointmentId,
            shouldAdvance: result.shouldAdvance
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: result.message,
            data: result
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/orchestrator/batch/checkin',
            appointmentId: req.body?.appointmentId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to handle check-in'
        ));
    }
};

/**
 * Manually advance to next batch
 * POST /api/orchestrator/batch/advance
 */
export const advanceToNextBatch = async (req, res, next) => {
    try {
        const { doctorId, appointmentDate, appointmentTime } = req.body;

        if (!doctorId || !appointmentDate || !appointmentTime) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'doctorId, appointmentDate, and appointmentTime are required'
            );
        }

        const result = await BatchOrchestrator.advanceToNextBatch(doctorId, new Date(appointmentDate), appointmentTime);

        logInfo('Manual batch advancement triggered', {
            doctorId,
            appointmentDate,
            appointmentTime,
            appointmentsTriggered: result?.appointmentsTriggered || 0
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: result ? `Advanced to next batch. ${result.appointmentsTriggered} appointments triggered.` : 'No next batch found to advance to.',
            data: result
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/orchestrator/batch/advance',
            doctorId: req.body?.doctorId,
            appointmentDate: req.body?.appointmentDate,
            appointmentTime: req.body?.appointmentTime
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to advance to next batch'
        ));
    }
};
