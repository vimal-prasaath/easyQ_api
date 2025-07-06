import Appointment from '../../model/appointment.js';
import { createValidation } from './validation.js';
import { constructPipeLine } from "./util.js"
import User from '../../model/userProfile.js';
import { google } from 'googleapis';
export async function createAppointment(req, res,next) {
  const data = req.body;
    try {
        const validationResult = await createValidation(data);

        if (!validationResult.isValid) {
            return next(new EasyQError(
                'ValidationError',
                validationResult.statusCode,
                true,
                validationResult.message
            ));
        }

        const newAppointment = await Appointment.create(data);
        const user = await User.findOne({ patientId: data.patientId });

        if (!user) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'User not found for Google Calendar integration.'
            ));
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({
            access_token: user.accessToken,
            refresh_token: user.refreshToken
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const start = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
        const end = new Date(start.getTime() + 30 * 60000);
        const event = {
            summary: 'Appointment',
            start: { dateTime: start, timeZone: 'Asia/Kolkata' },
            end: { dateTime: end, timeZone: 'Asia/Kolkata' }
        };

        const calenderevent = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        res.status(httpStatusCode.CREATED).json({
            message: 'Appointment booked and added to Google Calendar',
            appointment: newAppointment,
            googleCalendarEventId: calenderevent.data.id
        });

    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
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
            `Error creating appointment: ${error.message}`
        ));
    }
}



export async function deleteAppointment(req, res , next) {
   const { appointmentId } = req.params;
    try {
        if (!appointmentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Appointment ID is required.'
            ));
        }
        const appointment = await Appointment.findOneAndDelete({ appointmentId: appointmentId });
        if (!appointment) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found.'
            ));
        }
        res.status(httpStatusCode.OK).json({ message: "Appointment deleted successfully" });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Appointment ID format: ${appointmentId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to delete appointment: ${error.message}`
        ));
    }
}
export async function getAppointment(req, res , next) {
  const { appointmentId } = req.params;
    try {
        if (!appointmentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Appointment ID is required.'
            ));
        }
        const appointment = await Appointment.findOne({ appointmentId: appointmentId });
        if (!appointment) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found.'
            ));
        }
        res.status(httpStatusCode.OK).json({ message: "Appointment fetched successfully", appointment: appointment });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Appointment ID format: ${appointmentId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch appointment: ${error.message}`
        ));
    }
}

export async function getAllAppointmentOfDoctor(req, res ,next) {
 const { doctorId } = req.params;
    try {
        if (!doctorId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required.'
            ));
        }
        const appointments = await Appointment.find({ doctorId: doctorId });
        res.status(httpStatusCode.OK).json({ message: "Appointments fetched successfully", appointments: appointments });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Doctor ID format: ${doctorId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch doctor's appointments: ${error.message}`
        ));
    }
}

export async function getAllAppointmentOfHospital(req, res ,next) {
  const { hospitalId } = req.params;
    try {
        if (!hospitalId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required.'
            ));
        }
        const appointments = await Appointment.find({ hospitalId: hospitalId });
        res.status(httpStatusCode.OK).json({ message: "Appointments fetched successfully", appointments: appointments });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Hospital ID format: ${hospitalId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch hospital's appointments: ${error.message}`
        ));
    }
}



export async function updateAppointment(req, res ,next) {
  const { appointmentId } = req.params;
    const updates = req.body;
    try {
        if (!appointmentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Appointment ID is required for update.'
            ));
        }

        const pipeline = constructPipeLine(updates);

        const updatedAppointment = await Appointment.findOneAndUpdate(
            { appointmentId: appointmentId },
            pipeline,
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!updatedAppointment) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Appointment with ID '${appointmentId}' not found.`
            ));
        }

        res.status(httpStatusCode.OK).json({
            message: 'Appointment information updated successfully',
            appointment: updatedAppointment
        });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Appointment ID format: ${appointmentId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to update appointment: ${error.message}`
        ));
    }
}

export async function getAllAppointmentOfUser(req, res ,next) {
  const { patientId } = req.params;
    try {
        if (!patientId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Patient ID is required.'
            ));
        }
        const appointment = await Appointment.find({ patientId: patientId });
        res.status(httpStatusCode.OK).json({ data: appointment });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Patient ID format: ${patientId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch user's appointments: ${error.message}`
        ));
    }
} 