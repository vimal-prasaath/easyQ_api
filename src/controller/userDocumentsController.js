import Appointment from '../model/appointment.js';
import Doctor from '../model/doctor.js';
import Hospital from '../model/hospital.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';

/**
 * Get user documents grouped by appointment ID
 * GET /api/user/documents/:userId
 */
export const getUserDocuments = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID is required'
            );
        }

        logInfo('Getting user documents', { userId });

        // Get all appointments for the user with documents
        const appointments = await Appointment.find({
            patientId: userId,
            reportUrls: { $exists: true, $not: { $size: 0 } }
        })
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .lean();

        if (!appointments || appointments.length === 0) {
            return res.status(httpStatusCode.OK).json({
                status: 'success',
                message: 'No documents found for this user',
                data: {
                    userId,
                    appointments: []
                }
            });
        }

        // Group documents by appointment
        const groupedDocuments = appointments.map(appointment => {
            const reports = (appointment.reportUrls || []).map((url, index) => ({
                documentId: index + 1,
                documentUrl: url,
                fileName: url.split('/').pop() || `document_${index + 1}`
            }));

            return {
                appId: appointment.appointmentId,
                date: appointment.appointmentDate,
                hospital: appointment.hospitalName || 'Unknown Hospital',
                doctorId: appointment.doctorId,
                doctorName: appointment.doctorName || 'Unknown Doctor',
                slotNumber: appointment.slotNumber,
                tokenNumber: appointment.tokenNumber,
                tokenDisplay: appointment.tokenDisplay,
                reports: reports
            };
        });

        logInfo('User documents retrieved', {
            userId,
            totalAppointments: groupedDocuments.length,
            totalDocuments: groupedDocuments.reduce((sum, app) => sum + app.reports.length, 0)
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'User documents retrieved successfully',
            data: {
                userId,
                appointments: groupedDocuments,
                totalAppointments: groupedDocuments.length,
                totalDocuments: groupedDocuments.reduce((sum, app) => sum + app.reports.length, 0)
            }
        });

    } catch (error) {
        console.log(error)
        logError(error, {
            endpoint: '/api/user/documents',
            userId: req.params?.userId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve user documents'
        ));
    }
};
