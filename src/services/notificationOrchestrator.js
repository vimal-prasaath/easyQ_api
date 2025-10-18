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
     * Send appointment navigation notification
     * @param {string} appointmentId - Appointment ID
     */
    static async sendAppointmentNavigationNotification(appointmentId) {
        try {
            // Find appointment
            const appointment = await appointments.findOne({ appointmentId });
            
            if (!appointment) {
                throw new Error(`Appointment not found: ${appointmentId}`);
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
                throw new Error(`Patient address not found for appointment ${appointmentId}`);
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
            const userTokens = await UserToken.find({ userId: appointment.patientId, isActive: true });
            
            if (userTokens.length === 0) {
                throw new Error(`No active FCM tokens found for patient ${appointment.patientId}`);
            }

            // Prepare navigation data
            const navigationData = {
                sourceLocation: {
                    lat: patientAddress.origin.lat,
                    lng: patientAddress.origin.lng
                },
                destinationLocation: {
                    lat: hospital.location.coordinates[1],
                    lng: hospital.location.coordinates[0]
                },
                hospitalName: hospital.name,
                appointmentTime: appointment.appointmentTime,
                travelTimeMinutes
            };

            // Prepare FCM data with navigation coordinates
            const fcmData = {
                appointmentId: appointment.appointmentId,
                type: 'location_based_departure',
                travelTimeMinutes: travelTimeMinutes.toString(),
                suggestedDepartureTime: suggestedDepartureTime.toISOString(),
                hospitalName: hospital.name,
                deeplink: `app://appointment/${appointment.appointmentId}`,
                sourceLat: patientAddress.origin.lat.toString(),
                sourceLng: patientAddress.origin.lng.toString(),
                destinationLat: hospital.location.coordinates[1].toString(),
                destinationLng: hospital.location.coordinates[0].toString()
            };

            // Send notification to all active tokens
            for (const tokenDoc of userTokens) {
                await admin.messaging().send({
                    token: tokenDoc.fcmToken,
                    notification: {
                        title: 'Time to Leave!',
                        body: `Leave now to reach ${hospital.name} in ~${travelTimeMinutes} minutes. Your appointment is at ${appointment.appointmentTime}.`
                    },
                    data: fcmData
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

            logInfo('Appointment navigation notification sent', {
                appointmentId: appointment.appointmentId,
                patientId: appointment.patientId,
                travelTimeMinutes,
                tokensSent: userTokens.length
            });

            return {
                success: true,
                message: 'Location-based navigation notification sent successfully',
                data: {
                    appointmentId: appointment.appointmentId,
                    patientId: appointment.patientId,
                    notification: {
                        title: 'Time to Leave!',
                        body: `Leave now to reach ${hospital.name} in ~${travelTimeMinutes} minutes. Your appointment is at ${appointment.appointmentTime}.`
                    },
                    navigationData,
                    fcmData,
                    tokensSent: userTokens.length
                }
            };

        } catch (error) {
            logError('Failed to send appointment navigation notification', {
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

    /**
     * Send appointment booking confirmation notification
     * @param {string} patientId - Patient ID
     * @param {string} appointmentId - Appointment ID
     * @param {string} hospitalName - Hospital name
     * @param {string} appointmentDate - Appointment date
     * @param {string} appointmentTime - Appointment time
     */
    static async sendAppointmentBookingNotification(patientId, appointmentId, hospitalName, appointmentDate, appointmentTime) {
        try {
            // Find user FCM tokens
            const userTokens = await UserToken.find({ userId: patientId, isActive: true });

            if (userTokens.length === 0) {
                return {
                    success: true,
                    message: `No active FCM tokens found for patient ${patientId}`,
                    notificationsSent: 0,
                    tokensDeactivated: 0
                };
            }

            let totalTokensSent = 0;
            let totalTokensDeactivated = 0;
            const tokenErrorCodes = new Set([
                'messaging/invalid-argument',
                'messaging/registration-token-not-registered'
            ]);

            // Format the date for display
            const dateObj = new Date(appointmentDate);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const notificationMessage = `Appointment has been booked to ${hospitalName} at ${dayName} ${formattedDate} ${appointmentTime}`;

            for (const tokenDoc of userTokens) {
                try {
                    await admin.messaging().send({
                        token: tokenDoc.fcmToken,
                        notification: {
                            title: 'Appointment Booked Successfully',
                            body: notificationMessage
                        },
                        data: {
                            appointmentId: appointmentId,
                            type: 'appointment_booked',
                            hospitalName: hospitalName,
                            appointmentDate: appointmentDate,
                            appointmentTime: appointmentTime,
                            dayName: dayName,
                            formattedDate: formattedDate,
                            deeplink: `app://appointment/${appointmentId}`
                        }
                    });
                    totalTokensSent++;
                } catch (tokenError) {
                    if (tokenError.code && tokenErrorCodes.has(tokenError.code)) {
                        // Deactivate invalid token
                        tokenDoc.isActive = false;
                        await tokenDoc.save();
                        totalTokensDeactivated++;
                        logInfo('Deactivated invalid FCM token during appointment booking notification send', {
                            tokenId: tokenDoc._id,
                            userId: patientId,
                            error: tokenError.message
                        });
                    } else {
                        logError('Failed to send appointment booking notification to token', {
                            appointmentId,
                            patientId,
                            tokenId: tokenDoc._id,
                            error: tokenError.message
                        });
                    }
                }
            }

            const message = `Appointment booking notification sent to ${totalTokensSent} tokens. Deactivated ${totalTokensDeactivated} invalid tokens.`;
            logInfo('Appointment booking notification summary', {
                patientId,
                appointmentId,
                hospitalName,
                appointmentDate,
                appointmentTime,
                totalTokensSent,
                totalTokensDeactivated
            });

            return {
                success: true,
                message,
                notificationsSent: totalTokensSent,
                tokensDeactivated: totalTokensDeactivated
            };

        } catch (error) {
            logError('Failed to send appointment booking notification', {
                patientId,
                appointmentId,
                hospitalName,
                appointmentDate,
                appointmentTime,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Send follow-up appointment notification
     * @param {string} patientId - Patient ID
     * @param {string} appointmentId - Follow-up appointment ID
     * @param {string} followUpReason - Reason for follow-up
     * @param {string} appointmentDate - Appointment date
     * @param {string} appointmentTime - Appointment time
     */
    static async sendFollowUpNotification(patientId, appointmentId, followUpReason, appointmentDate, appointmentTime) {
        try {
            // Find user FCM tokens
            const userTokens = await UserToken.find({ userId: patientId, isActive: true });

            if (userTokens.length === 0) {
                return {
                    success: true,
                    message: `No active FCM tokens found for patient ${patientId}`,
                    notificationsSent: 0,
                    tokensDeactivated: 0
                };
            }

            let totalTokensSent = 0;
            let totalTokensDeactivated = 0;
            const tokenErrorCodes = new Set([
                'messaging/invalid-argument',
                'messaging/registration-token-not-registered'
            ]);

            const notificationMessage = `Follow-up appointment scheduled for ${followUpReason} on ${appointmentDate} at ${appointmentTime}`;

            for (const tokenDoc of userTokens) {
                try {
                    await admin.messaging().send({
                        token: tokenDoc.fcmToken,
                        notification: {
                            title: 'Follow-up Appointment Scheduled',
                            body: notificationMessage
                        },
                        data: {
                            appointmentId: appointmentId,
                            type: 'follow_up_scheduled',
                            followUpReason: followUpReason,
                            appointmentDate: appointmentDate,
                            appointmentTime: appointmentTime,
                            deeplink: `app://appointment/${appointmentId}`
                        }
                    });
                    totalTokensSent++;
                } catch (tokenError) {
                    if (tokenError.code && tokenErrorCodes.has(tokenError.code)) {
                        // Deactivate invalid token
                        tokenDoc.isActive = false;
                        await tokenDoc.save();
                        totalTokensDeactivated++;
                        logInfo('Deactivated invalid FCM token during follow-up notification send', {
                            tokenId: tokenDoc._id,
                            userId: patientId,
                            error: tokenError.message
                        });
                    } else {
                        logError('Failed to send follow-up notification to token', {
                            appointmentId,
                            patientId,
                            tokenId: tokenDoc._id,
                            error: tokenError.message
                        });
                    }
                }
            }

            const message = `Follow-up notification sent to ${totalTokensSent} tokens. Deactivated ${totalTokensDeactivated} invalid tokens.`;
            logInfo('Follow-up notification summary', {
                patientId,
                appointmentId,
                followUpReason,
                totalTokensSent,
                totalTokensDeactivated
            });

            return {
                success: true,
                message,
                notificationsSent: totalTokensSent,
                tokensDeactivated: totalTokensDeactivated
            };

        } catch (error) {
            logError('Failed to send follow-up notification', {
                patientId,
                appointmentId,
                followUpReason,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Send test appointment booking notification
     * @param {string} patientId - Patient ID
     * @param {string} hospitalName - Hospital name
     * @param {string} appointmentDate - Appointment date
     * @param {string} appointmentTime - Appointment time
     */
    static async sendTestAppointmentBookingNotification(patientId, hospitalName, appointmentDate, appointmentTime) {
        try {
            // Find user FCM tokens
            const userTokens = await UserToken.find({ userId: patientId, isActive: true });

            if (userTokens.length === 0) {
                return {
                    success: false,
                    message: `No active FCM tokens found for patient ${patientId}`,
                    notificationsSent: 0
                };
            }

            // Format the date for display
            const dateObj = new Date(appointmentDate);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const notificationMessage = `Appointment has been booked to ${hospitalName} at ${dayName} ${formattedDate} ${appointmentTime}`;

            // Send to first token only for testing
            const tokenDoc = userTokens[0];
            await admin.messaging().send({
                token: tokenDoc.fcmToken,
                notification: {
                    title: 'Test: Appointment Booked Successfully',
                    body: notificationMessage
                },
                data: {
                    appointmentId: 'TEST_APPOINTMENT_ID',
                    type: 'test_appointment_booked',
                    hospitalName: hospitalName,
                    appointmentDate: appointmentDate,
                    appointmentTime: appointmentTime,
                    dayName: dayName,
                    formattedDate: formattedDate,
                    deeplink: `app://appointment/TEST_APPOINTMENT_ID`
                }
            });

            logInfo('Test appointment booking notification sent', {
                patientId,
                hospitalName,
                appointmentDate,
                appointmentTime,
                tokenId: tokenDoc._id
            });

            return {
                success: true,
                message: 'Test appointment booking notification sent successfully',
                notificationsSent: 1,
                data: {
                    patientId,
                    hospitalName,
                    appointmentDate,
                    appointmentTime,
                    dayName,
                    formattedDate,
                    notificationMessage
                }
            };

        } catch (error) {
            logError('Failed to send test appointment booking notification', {
                patientId,
                hospitalName,
                appointmentDate,
                appointmentTime,
                error: error.message
            });
            throw error;
        }
    }
}
