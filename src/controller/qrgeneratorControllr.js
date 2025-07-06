import  {generateQR} from "../util/qrGemnerator.js"
import Appointment from '../model/appointment.js'
import User from '../model/userProfile.js'
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
export async function qrGeneator(req, res ,next) {
   const { userId, appointmentId } = req.body;
    try {
        if (!userId || !appointmentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID and Appointment ID are required.'
            ));
        }

        const patientData = await User.findOne({ userId: userId });
        const appointment = await Appointment.findOne({ appointmentId: appointmentId });

        if (!patientData) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Patient not found with the provided user ID.'
            ));
        }
        if (!appointment) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found with the provided appointment ID.'
            ));
        }

        const dataToEncodeObject = { userId: patientData._id.toString(), appointmentId: appointment._id.toString() };
        const qrCodeDataUrl = await generateQR(dataToEncodeObject);

        await Appointment.findOneAndUpdate(
            { appointmentId: appointmentId },
            { qrCodeDataUrl: qrCodeDataUrl },
            { new: true, runValidators: true }
        );

        res.status(httpStatusCode.OK).json({
            message: 'QR code generated and attached to appointment successfully.',
            qrCode: qrCodeDataUrl
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