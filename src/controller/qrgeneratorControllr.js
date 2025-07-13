
import  {generateQR} from "../util/qrGemnerator.js"
import Appointment from '../model/appointment.js'
import User from '../model/userProfile.js'
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { qrLogger, logApiRequest, logApiResponse, logDatabaseOperation, logPerformance } from '../config/logger.js';

export async function qrGeneator(req, res ,next) {
   const { userId, appointmentId } = req.body;
   const startTime = Date.now();
   
   // Log API request
   logApiRequest(req, { action: 'generate_qr' });

    try {
        qrLogger.info('QR code generation started', {
            userId: req.user?.userId,
            requestUserId: userId,
            appointmentId
        });

        if (!userId || !appointmentId) {
            qrLogger.warn('QR generation failed: Missing required parameters', {
                userId: req.user?.userId,
                providedUserId: userId,
                providedAppointmentId: appointmentId
            });
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID and Appointment ID are required.'
            ));
        }

        const patientData = await User.findOne({ userId: userId });
        logDatabaseOperation('findOne', 'User', { userId }, patientData ? [patientData] : []);

        const appointment = await Appointment.findOne({ appointmentId: appointmentId });
        logDatabaseOperation('findOne', 'Appointment', { appointmentId }, appointment ? [appointment] : []);

        if (!patientData) {
            qrLogger.warn('QR generation failed: Patient not found', {
                userId: req.user?.userId,
                searchedUserId: userId
            });
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Patient not found with the provided user ID.'
            ));
        }
        if (!appointment) {
            qrLogger.warn('QR generation failed: Appointment not found', {
                userId: req.user?.userId,
                searchedAppointmentId: appointmentId
            });
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found with the provided appointment ID.'
            ));
        }

        const dataToEncodeObject = { userId: patientData._id.toString(), appointmentId: appointment._id.toString() };
        const qrCodeDataUrl = await generateQR(dataToEncodeObject);

        const updatedAppointment = await Appointment.findOneAndUpdate(
            { appointmentId: appointmentId },
            { qrCodeDataUrl: qrCodeDataUrl },
            { new: true, runValidators: true }
        );
        logDatabaseOperation('findOneAndUpdate', 'Appointment', { appointmentId }, updatedAppointment ? [updatedAppointment] : []);

        const responseData = {
            message: 'QR code generated and attached to appointment successfully.',
            qrCode: qrCodeDataUrl
        };

        qrLogger.info('QR code generated successfully', {
            userId: req.user?.userId,
            patientId: patientData.userId,
            appointmentId: appointment.appointmentId
        });

        // Log performance
        logPerformance('QR Code Generation', Date.now() - startTime, {
            appointmentId,
            userId: req.user?.userId
        });

        // Log API response
        logApiResponse(req, res, responseData, { 
            action: 'generate_qr_success',
            appointmentId 
        });

        res.status(httpStatusCode.OK).json(responseData);

    } catch (error) {
        qrLogger.error('QR code generation error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            requestUserId: userId,
            appointmentId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid ID format provided.`
            ));
        }
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to generate or store QR code: ${error.message}`
        ));
    }
}

export async function getQRCode(req,res,next){
        const { userId, appointmentId } = req.query;
    try {
        if (!userId || !appointmentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID and Appointment ID are required as query parameters.'
            ));
        }

        const userData = await User.findOne({ userId: userId });
        const appointmentData = await Appointment.findOne({ appointmentId: appointmentId });

        if (!userData) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'User not found with the provided ID.'
            ));
        }
        if (!appointmentData) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found with the provided ID.'
            ));
        }

        res.status(httpStatusCode.OK).json({
            message: "Details fetched successfully",
            user: userData,
            appointmentDetails: appointmentData
        });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid ID format provided.`
            ));
        }
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch QR code details: ${error.message}`
        ));
    }
}



