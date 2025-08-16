
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

        const dataToEncodeObject = { userId: patientData.userId.toString(), appointmentId: appointment.appointmentId.toString() };
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
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'qr_scan_checkin_checkout' });

    try {
        qrLogger.info('QR code scan started', {
            userId: req.user?.userId,
            scannedUserId: userId,
            appointmentId
        });

        if (!userId || !appointmentId) {
            qrLogger.warn('QR scan failed: Missing required parameters', {
                userId: req.user?.userId,
                providedUserId: userId,
                providedAppointmentId: appointmentId
            });
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID and Appointment ID are required as query parameters.'
            ));
        }

        const userData = await User.findOne({ userId: userId });
        logDatabaseOperation('findOne', 'User', { userId }, userData ? [userData] : []);

        const appointmentData = await Appointment.findOne({ appointmentId: appointmentId });
        logDatabaseOperation('findOne', 'Appointment', { appointmentId }, appointmentData ? [appointmentData] : []);

        if (!userData) {
            qrLogger.warn('QR scan failed: User not found', {
                userId: req.user?.userId,
                searchedUserId: userId
            });
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'User not found with the provided ID.'
            ));
        }
        if (!appointmentData) {
            qrLogger.warn('QR scan failed: Appointment not found', {
                userId: req.user?.userId,
                searchedAppointmentId: appointmentId
            });
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found with the provided ID.'
            ));
        }

        // Validate appointment has valid hospital entry
        if (!appointmentData.hospitalId || !appointmentData.hospitalName) {
            qrLogger.warn('QR scan failed: Appointment has no valid hospital', {
                userId: req.user?.userId,
                appointmentId: appointmentId,
                hospitalId: appointmentData.hospitalId,
                hospitalName: appointmentData.hospitalName
            });
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Appointment does not have a valid hospital associated with it.'
            ));
        }

        // Check-in/Check-out logic
        const currentTime = new Date();
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Set to start of day for date comparison

        // Validate appointment date matches current date
        const appointmentDate = new Date(appointmentData.appointmentDate);
        const appointmentDateOnly = new Date(appointmentDate);
        appointmentDateOnly.setHours(0, 0, 0, 0);

        if (appointmentDateOnly.getTime() !== currentDate.getTime()) {
            qrLogger.warn('QR scan failed: Appointment date mismatch', {
                userId: req.user?.userId,
                appointmentId: appointmentId,
                appointmentDate: appointmentDateOnly,
                currentDate: currentDate,
                scannedUserId: userId
            });
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                `QR scan is only allowed on the appointment date (${appointmentDateOnly.toLocaleDateString()}). Today's date is ${currentDate.toLocaleDateString()}.`
            ));
        }

        let responseMessage = '';
        let updatedAppointment;
        let isCompleted = false;

        // Check if appointment is already completed for today
        if (appointmentData.checkInStatus === 'Checked-out' && 
            appointmentData.lastScannedDate && 
            appointmentData.lastScannedDate.getTime() === currentDate.getTime()) {
            
            // Appointment already completed for today
            isCompleted = true;
            responseMessage = `Appointment already completed for today. Patient ${userData.name} was checked out at ${appointmentData.checkOutTime?.toLocaleTimeString()}`;
            
            qrLogger.info('QR scan attempted on completed appointment', {
                userId: req.user?.userId,
                patientId: userData.userId,
                appointmentId: appointmentId,
                checkOutTime: appointmentData.checkOutTime,
                lastScannedDate: appointmentData.lastScannedDate
            });
        } else if (!appointmentData.isCheckedIn) {
            // Check-in the patient
            updatedAppointment = await Appointment.findOneAndUpdate(
                { appointmentId: appointmentId },
                {
                    checkInTime: currentTime,
                    isCheckedIn: true,
                    lastScannedDate: currentDate,
                    checkInStatus: 'Checked-in',
                    scannedBy: req.user?.userId || 'system'
                },
                { new: true, runValidators: true }
            );
            logDatabaseOperation('findOneAndUpdate', 'Appointment', { appointmentId }, updatedAppointment ? [updatedAppointment] : []);

            responseMessage = `Patient ${userData.name} checked in successfully at ${currentTime.toLocaleTimeString()}`;
            
            qrLogger.info('Patient checked in successfully', {
                userId: req.user?.userId,
                patientId: userData.userId,
                appointmentId: appointmentId,
                checkInTime: currentTime
            });
        } else {
            // Check-out the patient
            updatedAppointment = await Appointment.findOneAndUpdate(
                { appointmentId: appointmentId },
                {
                    checkOutTime: currentTime,
                    isCheckedIn: false,
                    lastScannedDate: currentDate,
                    checkInStatus: 'Checked-out',
                    scannedBy: req.user?.userId || 'system'
                },
                { new: true, runValidators: true }
            );
            logDatabaseOperation('findOneAndUpdate', 'Appointment', { appointmentId }, updatedAppointment ? [updatedAppointment] : []);

            responseMessage = `Patient ${userData.name} checked out successfully at ${currentTime.toLocaleTimeString()}`;
            
            qrLogger.info('Patient checked out successfully', {
                userId: req.user?.userId,
                patientId: userData.userId,
                appointmentId: appointmentId,
                checkOutTime: currentTime
            });
        }

        const responseData = {
            message: responseMessage,
            user: {
                userId: userData.userId,
                name: userData.name,
                email: userData.email
            },
            appointmentDetails: {
                appointmentId: isCompleted ? appointmentData.appointmentId : updatedAppointment.appointmentId,
                appointmentDate: isCompleted ? appointmentData.appointmentDate : updatedAppointment.appointmentDate,
                appointmentTime: isCompleted ? appointmentData.appointmentTime : updatedAppointment.appointmentTime,
                doctorName: isCompleted ? appointmentData.doctorName : updatedAppointment.doctorName,
                hospitalName: isCompleted ? appointmentData.hospitalName : updatedAppointment.hospitalName,
                checkInTime: isCompleted ? appointmentData.checkInTime : updatedAppointment.checkInTime,
                checkOutTime: isCompleted ? appointmentData.checkOutTime : updatedAppointment.checkOutTime,
                isCheckedIn: isCompleted ? appointmentData.isCheckedIn : updatedAppointment.isCheckedIn,
                checkInStatus: isCompleted ? appointmentData.checkInStatus : updatedAppointment.checkInStatus,
                lastScannedDate: isCompleted ? appointmentData.lastScannedDate : updatedAppointment.lastScannedDate
            },
            scanInfo: {
                scannedAt: currentTime,
                scannedBy: req.user?.userId || 'system',
                action: isCompleted ? 'Already Completed' : (updatedAppointment.isCheckedIn ? 'Check-in' : 'Check-out')
            }
        };

        // Log performance
        logPerformance('QR Code Scan', Date.now() - startTime, {
            appointmentId,
            userId: req.user?.userId,
            action: isCompleted ? 'already-completed' : (updatedAppointment.isCheckedIn ? 'check-in' : 'check-out')
        });

        // Log API response
        logApiResponse(req, res, responseData, { 
            action: 'qr_scan_success',
            appointmentId,
            actionType: isCompleted ? 'already-completed' : (updatedAppointment.isCheckedIn ? 'check-in' : 'check-out')
        });

        res.status(httpStatusCode.OK).json(responseData);

    } catch (error) {
        qrLogger.error('QR code scan error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            scannedUserId: userId,
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
            `Failed to process QR code scan: ${error.message}`
        ));
    }
}





