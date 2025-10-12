import appointments from '../model/appointment.js';
import UserToken from '../model/fcmToken.js';
import Hospital from '../model/hospital.js';
import User from '../model/userProfile.js';
import admin from '../config/firebaseAdmin.js';
import { getEta } from '../notificationOrchestrator/services/etaService.js';
import { logInfo, logError } from '../config/logger.js';

export class NotificationOrchestrator {
    
    /**
     * Send manual 2-hour reminder notification
     * @param {string} patientId - Patient ID
     * @param {string} appointmentId - Optional specific appointment ID
     */
    static async sendManual2HourReminder(patientId, appointmentId = null) {
        try {
            // Find appointment(s)
            const query = { patientId, status: 'Scheduled' };
            if (appointmentId) query.appointmentId = appointmentId;
            
            const appointmentList = await appointments.find(query);
            
            if (appointmentList.length === 0) {
                throw new Error(`No scheduled appointments found for patient ${patientId}`);
            }

            // Find user FCM tokens
            const userTokens = await UserToken.find({ userId: patientId, isActive: true });
            
            if (userTokens.length === 0) {
                throw new Error(`No active FCM tokens found for patient ${patientId}`);
            }

            const results = [];
            
            for (const appointment of appointmentList) {
                // Send notification to all active tokens
                for (const tokenDoc of userTokens) {
                    await admin.messaging().send({
                        token: tokenDoc.fcmToken,
                        notification: {
                            title: 'Upcoming Appointment',
                            body: `Today in 2 hours your appointment will be ready. We'll send you updates about when to leave.`
                        },
                        data: {
                            appointmentId: appointment.appointmentId,
                            type: 'manual_2hour_reminder',
                            deeplink: `app://appointment/${appointment.appointmentId}`
                        }
                    });
                }

                // Mark reminder as sent
                await appointments.updateOne(
                    { appointmentId: appointment.appointmentId },
                    { reminderSent: true }
                );

                results.push({
                    appointmentId: appointment.appointmentId,
                    tokensSent: userTokens.length,
                    message: '2-hour reminder sent successfully'
                });

                logInfo('Manual 2-hour reminder sent', {
                    appointmentId: appointment.appointmentId,
                    patientId,
                    tokensSent: userTokens.length
                });
            }

            return {
                success: true,
                message: `Sent 2-hour reminders for ${results.length} appointment(s)`,
                results
            };

        } catch (error) {
            logError('Failed to send manual 2-hour reminder', {
                patientId,
                appointmentId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Send location-based departure notification
     * @param {string} patientId - Patient ID
     * @param {string} appointmentId - Optional specific appointment ID
     */
    static async sendLocationBasedNotification(patientId, appointmentId = null) {
        try {
            // Find appointment
            const query = { patientId, status: 'Scheduled' };
            if (appointmentId) query.appointmentId = appointmentId;
            
            const appointment = await appointments.findOne(query);
            
            if (!appointment) {
                throw new Error(`No scheduled appointment found for patient ${patientId}`);
            }

            // Get hospital location
            const hospital = await Hospital.findOne({ hospitalId: appointment.hospitalId });
            if (!hospital?.location?.coordinates) {
                throw new Error(`Hospital location not found for ${appointment.hospitalId}`);
            }

            // Get patient address
            let patientAddress = appointment.patientAddress;
            if (!patientAddress && appointment.patientId) {
                const user = await User.findOne({ userId: appointment.patientId }).select('addresses');
                if (user?.addresses) {
                    const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
                    if (defaultAddress) {
                        patientAddress = {
                            origin: defaultAddress.origin,
                            addressName: defaultAddress.addressName
                        };
                    }
                }
            }

            if (!patientAddress?.origin) {
                throw new Error(`Patient address not found for ${patientId}`);
            }

            // Calculate ETA
            const etaResult = await getEta({
                origin: patientAddress.origin,
                destination: {
                    lat: hospital.location.coordinates[1],
                    lng: hospital.location.coordinates[0]
                },
                mode: 'driving',
                departureTime: 'now'
            });

            // Calculate suggested departure time
            const appointmentDateTime = new Date(appointment.appointmentDate);
            const [hours, minutes] = appointment.appointmentTime.split(':');
            appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const travelTimeMinutes = Math.ceil(etaResult.durationSeconds / 60);
            const bufferMinutes = 5; // 5 minute buffer
            const suggestedDepartureTime = new Date(appointmentDateTime.getTime() - (travelTimeMinutes + bufferMinutes) * 60000);

            // Find user FCM tokens
            const userTokens = await UserToken.find({ userId: patientId, isActive: true });
            
            if (userTokens.length === 0) {
                throw new Error(`No active FCM tokens found for patient ${patientId}`);
            }

            // Send notification to all active tokens
            for (const tokenDoc of userTokens) {
                await admin.messaging().send({
                    token: tokenDoc.fcmToken,
                    notification: {
                        title: 'Time to Leave!',
                        body: `Leave now to reach ${hospital.name} in ~${travelTimeMinutes} minutes. Your appointment is at ${appointment.appointmentTime}.`
                    },
                    data: {
                        appointmentId: appointment.appointmentId,
                        type: 'location_based_departure',
                        travelTimeMinutes: travelTimeMinutes.toString(),
                        suggestedDepartureTime: suggestedDepartureTime.toISOString(),
                        hospitalName: hospital.name,
                        deeplink: `app://appointment/${appointment.appointmentId}`
                    }
                });
            }

            // Update appointment with suggested arrival time
            await appointments.updateOne(
                { appointmentId: appointment.appointmentId },
                { 
                    suggestedArrivalAt: new Date(appointmentDateTime.getTime() - bufferMinutes * 60000),
                    batchStatus: 'sent'
                }
            );

            logInfo('Location-based notification sent', {
                appointmentId: appointment.appointmentId,
                patientId,
                travelTimeMinutes,
                tokensSent: userTokens.length
            });

            return {
                success: true,
                message: 'Location-based departure notification sent successfully',
                data: {
                    appointmentId: appointment.appointmentId,
                    travelTimeMinutes,
                    suggestedDepartureTime: suggestedDepartureTime.toISOString(),
                    hospitalName: hospital.name,
                    tokensSent: userTokens.length
                }
            };

        } catch (error) {
            logError('Failed to send location-based notification', {
                patientId,
                appointmentId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Send doctor delay notification
     * @param {string} doctorId - Doctor ID
     * @param {number} delayMinutes - Delay in minutes
     * @param {string} reason - Reason for delay
     */
    static async sendDoctorDelayNotification(doctorId, delayMinutes, reason, date = null) {
        try {
            // Find all scheduled appointments for today for this doctor
            const baseDate = date ? new Date(date) : new Date();
            baseDate.setHours(0, 0, 0, 0);
            
            const scheduledAppointments = await appointments.find({
                doctorId,
                appointmentDate: {
                    $gte: baseDate,
                    $lt: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
                },
                status: 'Scheduled'
            });

            if (scheduledAppointments.length === 0) {
                return {
                    success: true,
                    message: 'No scheduled appointments found for today',
                    notificationsSent: 0
                };
            }

            const results = [];
            
            for (const appointment of scheduledAppointments) {
                // Find user FCM tokens
                const userTokens = await UserToken.find({ userId: appointment.patientId, isActive: true });
                
                if (userTokens.length > 0) {
                    // Send notification to all active tokens
                    for (const tokenDoc of userTokens) {
                        await admin.messaging().send({
                            token: tokenDoc.fcmToken,
                            notification: {
                                title: 'Appointment Delay Update',
                                body: `Doctor is delayed by ${delayMinutes} minutes. Reason: ${reason}. If you wish to reschedule, you can click and reschedule.`
                            },
                            data: {
                                appointmentId: appointment.appointmentId,
                                type: 'doctor_delay',
                                delayMinutes: delayMinutes.toString(),
                                reason,
                                deeplink: `app://reschedule/${appointment.appointmentId}`
                            }
                        });
                    }

                    results.push({
                        appointmentId: appointment.appointmentId,
                        patientId: appointment.patientId,
                        tokensSent: userTokens.length
                    });
                }
            }

            logInfo('Doctor delay notifications sent', {
                doctorId,
                delayMinutes,
                date: baseDate.toISOString().split('T')[0],
                appointmentsNotified: results.length
            });

            return {
                success: true,
                message: `Doctor delay notifications sent to ${results.length} patients`,
                notificationsSent: results.length,
                results
            };

        } catch (error) {
            logError('Failed to send doctor delay notifications', {
                doctorId,
                delayMinutes,
                error: error.message
            });
            throw error;
        }
    }
}
