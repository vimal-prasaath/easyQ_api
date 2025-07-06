
import Doctor from '../../model/doctor.js'; 
import Hospital from '../../model/hospital/index.js'; 
import User from '../../model/userProfile.js'; 
import { EasyQError } from '../../config/error.js';
import { httpStatusCode } from '../../util/statusCode.js';
export const createValidation = async (data) => {
   
    if (!data.patientId || !data.doctorId || !data.hospitalId ||
        !data.appointmentDate || !data.appointmentTime ||
        !data.reasonForAppointment || !data.appointmentType || !data.paymentStatus) {
        throw new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'Missing mandatory appointment fields.'
        );
    }

    try {
        const patientExists = await User.findOne({ _id: data.patientId });
        if (!patientExists) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Patient with ID ${data.patientId} not found.`
            );
        }
    } catch (error) {
        if (error.name === 'CastError') {
            throw new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid patient ID format: ${data.patientId}.`
            );
        }
        if (error instanceof EasyQError) {
            throw error;
        }
        throw new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            'An unexpected error occurred during patient validation.'
        );
    }

    try {
        const doctorExists = await Doctor.findOne({ _id: data.doctorId });
        if (!doctorExists) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Doctor with ID ${data.doctorId} not found.`
            );
        }
    } catch (error) {
        if (error.name === 'CastError') {
            throw new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid doctor ID format: ${data.doctorId}.`
            );
        }
        if (error instanceof EasyQError) {
            throw error;
        }
        throw new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            'An unexpected error occurred during doctor validation.'
        );
    }

    try {
        const hospitalExists = await Hospital.findOne({ _id: data.hospitalId });
        if (!hospitalExists) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Hospital with ID ${data.hospitalId} not found.`
            );
        }
    } catch (error) {
        if (error.name === 'CastError') {
            throw new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid hospital ID format: ${data.hospitalId}.`
            );
        }
        if (error instanceof EasyQError) {
            throw error;
        }
        throw new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            'An unexpected error occurred during hospital validation.'
        );
    }
};