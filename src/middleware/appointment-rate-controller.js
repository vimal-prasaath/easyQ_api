import Appointment from "../model/appointment.js";
import Doctor from "../model/doctor.js";
import { EasyQError } from "../config/error.js";
import { httpStatusCode } from "../util/statusCode.js";
import { logInfo, logWarn, logError } from "../config/logger.js";

export async function appointmentLimiter(req, res, next) {
    const { doctorId, appointmentDate } = req.body;

    if (!doctorId || !appointmentDate) {
        return next(new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'Doctor ID and appointment date are required to check the appointment limit.'
        ));
    }

    try {
        // Get doctor's max appointment limit
        const doctor = await Doctor.findOne({ doctorId }).select('maxAppointment');

        if (!doctor) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Doctor not found.'
            ));
        }

        const APPOINTMENT_LIMIT = doctor.maxAppointment;
        console.log(APPOINTMENT_LIMIT,"KKK")
        // Count current appointments for that doctor on the date
        const appointmentCount = await Appointment.countDocuments({
            doctorId,
            appointmentDate: new Date(appointmentDate)
        });

        if (appointmentCount >= APPOINTMENT_LIMIT) {
            logWarn('Appointment limit reached for doctor', {
                doctorId,
                appointmentDate,
                count: appointmentCount
            });

            return next(new EasyQError(
                'LimitExceededError',
                httpStatusCode.FORBIDDEN,
                true,
                `The doctor has already reached the maximum of ${APPOINTMENT_LIMIT} appointments for ${appointmentDate}.`
            ));
        }

        logInfo('Appointment limit check passed', {
            doctorId,
            appointmentDate,
            count: appointmentCount
        });

        next();
    } catch (error) {
        logError('Error during appointment limit check middleware', {
            doctorId,
            appointmentDate,
            error: error.message
        });

        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            'An internal server error occurred while checking the appointment limit.'
        ));
    }
}
