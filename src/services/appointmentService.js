
import Appointment from '../model/appointment.js';
import User from '../model/userProfile.js';
import Doctor from '../model/doctor.js';
import Hospital from '../model/hospital.js';
import { google } from 'googleapis';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError, logWarn } from '../config/logger.js';
import { constructPipeLine , getAppointmentByIdPipe, getAppointmentByAppointmentIdPipe } from '../controller/util.js';
import { TokenAssignmentService } from './tokenAssignmentService.js';

export class AppointmentService {

    static async createAppointment(appointmentData) {
        try {
            logInfo('Creating appointment', {
                patientId: appointmentData.patientId,
                doctorId: appointmentData.doctorId,
                hospitalId: appointmentData.hospitalId,
                appointmentDate: appointmentData.appointmentDate
            });

            // Assign token number before creating appointment
            const appointmentDate = new Date(appointmentData.appointmentDate);
            const tokenInfo = await TokenAssignmentService.assignToken(
                appointmentData.doctorId,
                appointmentDate,
                appointmentData.appointmentTime
            );

            // Get patient address if provided
            let patientAddress = null;
            if (appointmentData.patientAddress) {
                // If full address object is provided
                if (appointmentData.patientAddress.origin) {
                    patientAddress = {
                        addressId: appointmentData.patientAddress.addressId || null,
                        addressName: appointmentData.patientAddress.addressName,
                        origin: {
                            lat: appointmentData.patientAddress.origin.lat,
                            lng: appointmentData.patientAddress.origin.lng
                        },
                        fullAddress: appointmentData.patientAddress.fullAddress
                    };
                }
                // If only addressId is provided, fetch from user profile
                else if (appointmentData.patientAddress.addressId) {
                    const user = await User.findOne({ userId: appointmentData.patientId }).select('addresses');
                    if (user?.addresses) {
                        const selectedAddress = user.addresses.find(addr => addr.addressId === appointmentData.patientAddress.addressId);
                        if (selectedAddress) {
                            patientAddress = {
                                addressId: selectedAddress.addressId,
                                addressName: selectedAddress.addressName,
                                origin: {
                                    lat: selectedAddress.origin.lat,
                                    lng: selectedAddress.origin.lng
                                },
                                fullAddress: selectedAddress.fullAddress
                            };
                        }
                    }
                }
            } else if (appointmentData.patientId) {
                // Try to get default address from user profile
                const user = await User.findOne({ userId: appointmentData.patientId }).select('addresses');
                if (user?.addresses) {
                    const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
                    if (defaultAddress) {
                        patientAddress = {
                            addressId: defaultAddress.addressId,
                            addressName: defaultAddress.addressName,
                            origin: {
                                lat: defaultAddress.origin.lat,
                                lng: defaultAddress.origin.lng
                            },
                            fullAddress: defaultAddress.fullAddress
                        };
                    }
                }
            }

            // Assign batch number
            const { BatchOrchestrator } = await import('./batchOrchestrator.js');
            const batchNumber = await BatchOrchestrator.assignBatchNumber(
                appointmentData.doctorId,
                appointmentDate,
                appointmentData.appointmentTime,
                tokenInfo.tokenNumber
            );

            // Add token information, patient address, and batch info to appointment data
            const appointmentWithToken = {
                ...appointmentData,
                slotNumber: tokenInfo.slotNumber,
                tokenNumber: tokenInfo.tokenNumber,
                tokenDisplay: tokenInfo.tokenDisplay,
                batchNumber,
                batchStatus: 'pending',
                patientAddress
            };

            // Create appointment with schema validation
            const newAppointment = await Appointment.create(appointmentWithToken);

            // Get user for Google Calendar integration
            const user = await User.findOne({ userId: appointmentData.patientId });

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

              await this.updateDoctorAndHospitalWithPatient(
                appointmentData.doctorId,
                appointmentData.patientId,
                appointmentData.hospitalId
            );

            logInfo('Appointment created successfully', {
                appointmentId: newAppointment.appointmentId,
                patientId: appointmentData.patientId,
                tokenDisplay: newAppointment.tokenDisplay,
                slotNumber: newAppointment.slotNumber,
                tokenNumber: newAppointment.tokenNumber,
                hasPatientAddress: !!newAppointment.patientAddress
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
            const pipeline = getAppointmentByIdPipe(patientId);
            // pipeline.unshift({ $match: { patientId } });

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
            const appointment = await Appointment.aggregate(getAppointmentByAppointmentIdPipe(appointmentId));

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

     static async processAppointment(appointmentId, changedByUserId, paymentDetails) {
        logInfo('Processing appointment', { appointmentId, changedByUserId, paymentDetails });

        try {
            const appointment = await Appointment.findOne({ appointmentId });

            if (!appointment) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Appointment with ID ${appointmentId} not found.`
                );
            }

            // Validate payment status first
            if (!paymentDetails || !paymentDetails.paymentStatus || paymentDetails.paymentStatus.toLowerCase() !== 'success') {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Payment status must be 'success' to complete the appointment. Current status: ${paymentDetails?.paymentStatus || 'N/A'}.`
                );
            }

            // Update payment related fields
            appointment.paymentStatus = paymentDetails.paymentStatus;
            if (paymentDetails.paymentAmount !== undefined) {
                appointment.paymentAmount = paymentDetails.paymentAmount;
            }
            if (paymentDetails.currency) {
                appointment.currency = paymentDetails.currency;
            }
            if (paymentDetails.paymentMethod) {
                appointment.paymentMethod = paymentDetails.paymentMethod;
            }

            // Handle transaction ID
            if (paymentDetails.transactionId) {
                if (appointment.transactionId && appointment.transactionId === paymentDetails.transactionId) {
                    logInfo('Transaction ID already exists and matches for this appointment; no update needed.', { appointmentId, transactionId: paymentDetails.transactionId });
                } else if (appointment.transactionId && appointment.transactionId !== paymentDetails.transactionId) {
                    logWarn('Existing transaction ID found but a new one provided. Updating transaction ID.', {
                        appointmentId,
                        oldTransactionId: appointment.transactionId,
                        newTransactionId: paymentDetails.transactionId
                    });
                    appointment.transactionId = paymentDetails.transactionId;
                } else {
                    appointment.transactionId = paymentDetails.transactionId;
                    logInfo('New transaction ID added to appointment.', { appointmentId, transactionId: paymentDetails.transactionId });
                }
            } else {
                logWarn('Payment successful but no transaction ID provided for appointment.', { appointmentId });
                appointment.status = 'pending';
            }

            logInfo('Payment details updated for appointment.', { appointmentId });
            appointment.status = 'completed';

            appointment.statusHistory.push({
                status: 'completed',
                timestamp: new Date(),
                changedBy: changedByUserId || 'System' // Use provided user ID or default to 'System'
            });

            await appointment.save();
            logInfo('Appointment status updated to completed and saved.', { appointmentId });

            return appointment;
        } catch (error) {
            logError('Error processing appointment', {
                error: error.message,
                stack: error.stack,
                appointmentId,
                changedByUserId,
                paymentDetails
            });
            throw error;
        }
    }
     static async updateDoctorAndHospitalWithPatient(doctorId, patientId, hospitalId) {
        try {
            logInfo('Attempting to update Doctor and Hospital models with patient ID', { doctorId, patientId, hospitalId });

            if (doctorId) {
                const doctor = await Doctor.findOne({ doctorId: doctorId });
                if (doctor) {
                    if (!doctor.patientIds.includes(patientId)) {
                        doctor.patientIds.push(patientId);
                        await doctor.save();
                        logInfo('Patient ID added to doctor model successfully', { doctorId, patientId });
                    } else {
                        logInfo('Patient ID already exists in doctor model, no update needed', { doctorId, patientId });
                    }
                } else {
                    logWarn('Doctor not found for updating patientIds', { doctorId });
                }
            } else {
                logInfo('No doctorId provided, skipping doctor model update');
            }

            if (hospitalId) {
                const hospital = await Hospital.findOne({ hospitalId: hospitalId });
                if (hospital) {
                    if (!hospital.patientIds.includes(patientId)) {
                        hospital.patientIds.push(patientId);
                        await hospital.save();
                        logInfo('Patient ID added to hospital model successfully', { hospitalId, patientId });
                    } else {
                        logInfo('Patient ID already exists in hospital model, no update needed', { hospitalId, patientId });
                    }
                } else {
                    logWarn('Hospital not found for updating patientIds', { hospitalId });
                }
            } else {
                logInfo('No hospitalId provided, skipping hospital model update');
            }

        } catch (error) {
            logError('Error updating Doctor or Hospital models with patient ID', {
                doctorId,
                patientId,
                hospitalId,
                error: error.message,
                stack: error.stack
            });
        }
    }
    
 static async safeCreateAppointment(appointmentData) {
    const { doctorId, appointmentDate, patientId } = appointmentData;

    if (!doctorId || !appointmentDate || !patientId) {
        throw new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'Doctor ID, appointment date, and patient ID are required.'
        );
    }

    const doctor = await Doctor.findOne({ doctorId }).select('maxAppointment');

    if (!doctor) {
        throw new EasyQError(
            'NotFoundError',
            httpStatusCode.NOT_FOUND,
            true,
            'Doctor not found.'
        );
    }

    // 🔁 Convert "MM/DD/YYYY" to Date safely
    let parsedDate;
    try {
        const [month, day, year] = appointmentDate.split('/');
        parsedDate = new Date(`${year}-${month}-${day}`);
        if (isNaN(parsedDate)) throw new Error();
    } catch {
        throw new EasyQError(
            'InvalidDateFormat',
            httpStatusCode.BAD_REQUEST,
            true,
            `Invalid date format. Expected MM/DD/YYYY but got: ${appointmentDate}`
        );
    }

    // ⏳ Match all appointments in that day
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await Appointment.countDocuments({
        doctorId,
        appointmentDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (count >= doctor.maxAppointment) {
        throw new EasyQError(
            'LimitExceededError',
            httpStatusCode.FORBIDDEN,
            true,
            `Appointment limit of ${doctor.maxAppointment} reached for ${appointmentDate}.`
        );
    }

    return {
        limitReached: false,
    };
}

    static async getAppointmentsSummary(date = null, hospitalId = null) {
        try {
            logInfo('Fetching appointments summary', { date, hospitalId });

            // Build match condition
            const matchCondition = {};
            if (date) {
                // Convert date string to start and end of day
                const startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);
                
                const endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);
                
                matchCondition.appointmentDate = {
                    $gte: startDate,
                    $lte: endDate
                };
            }
            
            // Filter by hospital if provided
            if (hospitalId) {
                matchCondition.hospitalId = hospitalId;
            }

            console.log(matchCondition)

            const pipeline = [
                {
                    $match: matchCondition
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'patientId',
                        foreignField: 'userId',
                        as: 'patientInfo'
                    }
                },
                { $unwind: { path: '$patientInfo', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'doctors',
                        localField: 'doctorId',
                        foreignField: 'doctorId',
                        as: 'doctorInfo'
                    }
                },
                { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        appointmentId: 1,
                        reportUrls: 1,
                        appointmentDate: 1,
                        checkInStatus: 1,
                        checkOutStatus: 1,
                        patientName: '$patientInfo.name',
                        doctorName: '$doctorInfo.name'
                    }
                },
                {
                    $sort: { appointmentDate: -1 }
                }
            ];

            const appointments = await Appointment.aggregate(pipeline);

            console.log('🔍 Raw appointments from aggregation:', JSON.stringify(appointments, null, 2));
            
            logInfo('Appointments summary fetched successfully', { 
                count: appointments.length,
                date: date || 'all dates'
            });

            return appointments;

        } catch (error) {
            logError('Error fetching appointments summary', {
                error: error.message,
                date
            });
            throw error;
        }
    }

}


