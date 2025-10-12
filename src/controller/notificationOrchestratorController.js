import { NotificationOrchestrator } from '../services/notificationOrchestrator.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';

/**
 * Send manual 2-hour reminder notification
 * POST /api/orchestrator/notifications/2hour-reminder
 */
export const sendManual2HourReminder = async (req, res, next) => {
    try {
        const { patientId, appointmentId } = req.body;

        if (!patientId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'patientId is required'
            );
        }

        const result = await NotificationOrchestrator.sendManual2HourReminder(patientId, appointmentId);

        logInfo('Manual 2-hour reminder API called', {
            patientId,
            appointmentId,
            resultsCount: result.results.length
        });

        // Prefer non-array response
        if (result.results && result.results.length === 1) {
            return res.status(httpStatusCode.OK).json({
                status: 'success',
                message: result.message,
                data: result.results[0]
            });
        }

        // Aggregate when multiple appointments
        const aggregate = (result.results || []).reduce((acc, r) => {
            acc.appointmentsProcessed += 1;
            acc.tokensSent += (r.tokensSent || 0);
            acc.tokensDeactivated += (r.tokensDeactivated || 0);
            return acc;
        }, { appointmentsProcessed: 0, tokensSent: 0, tokensDeactivated: 0 });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: result.message,
            data: aggregate
        });

    } catch (error) {
        console.log(error)
        logError(error, { 
            endpoint: '/api/orchestrator/notifications/2hour-reminder',
            patientId: req.body?.patientId,
            appointmentId: req.body?.appointmentId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to send 2-hour reminder notification'
        ));
    }
};

/**
 * Send location-based departure notification
 * POST /api/orchestrator/notifications/location-based
 */
export const sendLocationBasedNotification = async (req, res, next) => {
    try {
        const { patientId, appointmentId } = req.body;

        if (!patientId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'patientId is required'
            );
        }

        const result = await NotificationOrchestrator.sendLocationBasedNotification(patientId, appointmentId);

        logInfo('Location-based notification API called', {
            patientId,
            appointmentId,
            travelTimeMinutes: result.data.travelTimeMinutes
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: result.message,
            data: result.data
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/orchestrator/notifications/location-based',
            patientId: req.body?.patientId,
            appointmentId: req.body?.appointmentId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to send location-based notification'
        ));
    }
};

/**
 * Send doctor delay notification
 * POST /api/orchestrator/notifications/doctor-delay
 */
export const sendDoctorDelayNotification = async (req, res, next) => {
    try {
        const { doctorId, delayMinutes, reason, date } = req.body;

        if (!doctorId || !delayMinutes || !reason) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'doctorId, delayMinutes, and reason are required'
            );
        }

        if (delayMinutes < 1 || delayMinutes > 480) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'delayMinutes must be between 1 and 480 minutes'
            );
        }

        const result = await NotificationOrchestrator.sendDoctorDelayNotification(doctorId, delayMinutes, reason, date);

        logInfo('Doctor delay notification API called', {
            doctorId,
            delayMinutes,
            notificationsSent: result.notificationsSent
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: result.message,
            data: {
                doctorId,
                delayMinutes,
                date: (date ? new Date(date) : new Date()).toISOString().split('T')[0],
                notificationsSent: result.notificationsSent,
                results: result.results
            }
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/orchestrator/notifications/doctor-delay',
            doctorId: req.body?.doctorId,
            delayMinutes: req.body?.delayMinutes
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to send doctor delay notification'
        ));
    }
};
