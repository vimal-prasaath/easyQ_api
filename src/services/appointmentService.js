
import Appointment from '../model/appointment.js';
import User from '../model/userProfile.js';
import Doctor from '../model/doctor.js';
import Hospital from '../model/hospital.js';
import { google } from 'googleapis';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError, logWarn } from '../config/logger.js';
import { constructPipeLine } from '../controller/util.js';

export class AppointmentService {
    
    static async createAppointment(appointmentData) {
        try {
            logInfo('Creating appointment', {
                patientId: appointmentData.patientId,
                doctorId: appointmentData.doctorId,
                hospitalId: appointmentData.hospitalId,
                appointmentDate: appointmentData.appointmentDate
            });

            // Create appointment with schema validation
            const newAppointment = await Appointment.create(appointmentData);
            
            // Get user for Google Calendar integration
            const user = await User.findOne({ patientId: appointmentData.patientId });
            
            if (!user) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User not found for Google Calendar integration.'
                );
            }

            // Google Calendar integration
            if (user.accessToken && user.refreshToken) {
                try {
                    await this.createGoogleCalendarEvent(user, appointmentData);
                } catch (calendarError) {
                    logWarn('Google Calendar integration failed', {
                        appointmentId: newAppointment.appointmentId,
                        error: calendarError.message
                    });
                }
            }

            logInfo('Appointment created successfully', {
                appointmentId: newAppointment.appointmentId,
                patientId: appointmentData.patientId
            });

            return newAppointment;
        } catch (error) {
            logError('Error creating appointment', {
                error: error.message,
                stack: error.stack,
                appointmentData
            });
            throw error;
        }
    }

    static async createGoogleCalendarEvent(user, appointmentData) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        
        oauth2Client.setCredentials({
            access_token: user.accessToken,
            refresh_token: user.refreshToken
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const start = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}`);
        const end = new Date(start.getTime() + 30 * 60000); // 30 minutes duration
        
        const event = {
            summary: 'Medical Appointment',
            description: appointmentData.reasonForAppointment,
            start: { dateTime: start, timeZone: 'Asia/Kolkata' },
            end: { dateTime: end, timeZone: 'Asia/Kolkata' }
        };

        const calendarResponse = await calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        return calendarResponse.data;
    }

    static async getAppointmentsByPatient(patientId) {
        try {
            const pipeline = constructPipeLine();
            pipeline.unshift({ $match: { patientId } });
            
            const appointments = await Appointment.aggregate(pipeline);
            
            logInfo('Retrieved patient appointments', {
                patientId,
                count: appointments.length
            });
            
            return appointments;
        } catch (error) {
            logError('Error retrieving patient appointments', {
                error: error.message,
                patientId
            });
            throw error;
        }
    }

    static async getAppointmentsByDoctor(doctorId) {
        try {
            const pipeline = constructPipeLine();
            pipeline.unshift({ $match: { doctorId } });
            
            const appointments = await Appointment.aggregate(pipeline);
            
            logInfo('Retrieved doctor appointments', {
                doctorId,
                count: appointments.length
            });
            
            return appointments;
        } catch (error) {
            logError('Error retrieving doctor appointments', {
                error: error.message,
                doctorId
            });
            throw error;
        }
    }

    static async getAppointmentsByHospital(hospitalId) {
        try {
            const pipeline = constructPipeLine();
            pipeline.unshift({ $match: { hospitalId } });
            
            const appointments = await Appointment.aggregate(pipeline);
            
            logInfo('Retrieved hospital appointments', {
                hospitalId,
                count: appointments.length
            });
            
            return appointments;
        } catch (error) {
            logError('Error retrieving hospital appointments', {
                error: error.message,
                hospitalId
            });
            throw error;
        }
    }

    static async getAllAppointments() {
        try {
            const pipeline = constructPipeLine();
            const appointments = await Appointment.aggregate(pipeline);
            
            logInfo('Retrieved all appointments', {
                count: appointments.length
            });
            
            return appointments;
        } catch (error) {
            logError('Error retrieving all appointments', {
                error: error.message
            });
            throw error;
        }
    }

    static async updateAppointment(appointmentId, updateData) {
        try {
            const updatedAppointment = await Appointment.findOneAndUpdate(
                { appointmentId },
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedAppointment) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Appointment not found.'
                );
            }

            logInfo('Appointment updated successfully', {
                appointmentId,
                updateData
            });

            return updatedAppointment;
        } catch (error) {
            logError('Error updating appointment', {
                error: error.message,
                appointmentId,
                updateData
            });
            throw error;
        }
    }

    static async deleteAppointment(appointmentId) {
        try {
            const deletedAppointment = await Appointment.findOneAndDelete({ appointmentId });

            if (!deletedAppointment) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Appointment not found.'
                );
            }

            logInfo('Appointment deleted successfully', {
                appointmentId
            });

            return deletedAppointment;
        } catch (error) {
            logError('Error deleting appointment', {
                error: error.message,
                appointmentId
            });
            throw error;
        }
    }

    static async getAppointmentById(appointmentId) {
        try {
            const appointment = await Appointment.findOne({ appointmentId });

            if (!appointment) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Appointment not found.'
                );
            }

            return appointment;
        } catch (error) {
            logError('Error retrieving appointment', {
                error: error.message,
                appointmentId
            });
            throw error;
        }
    }
}
