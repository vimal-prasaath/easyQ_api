import appointments from '../model/appointment.js';
import UserToken from '../model/fcmToken.js';
import Hospital from '../model/hospital.js';
import User from '../model/userProfile.js';
import Doctor from '../model/doctor.js';
import admin from '../config/firebaseAdmin.js';
import { getEta } from '../notificationOrchestrator/services/etaService.js';
import { logInfo, logError } from '../config/logger.js';

export class BatchOrchestrator {
    
    static BATCH_SIZE = 5; // 5 patients per batch
    static BUFFER_MINUTES = 5; // 5 minute buffer before appointment
    
    /**
     * Assign batch numbers to appointments when they are created
     * @param {string} doctorId - Doctor ID
     * @param {Date} appointmentDate - Appointment date
     * @param {string} appointmentTime - Appointment time (HH:MM)
     * @param {number} tokenNumber - Token number for this appointment
     */
    static async assignBatchNumber(doctorId, appointmentDate, appointmentTime, tokenNumber) {
        try {
            const batchNumber = Math.ceil(tokenNumber / this.BATCH_SIZE);
            
            logInfo('Batch number assigned', {
                doctorId,
                appointmentDate: appointmentDate.toISOString().split('T')[0],
                appointmentTime,
                tokenNumber,
                batchNumber
            });
            
            return batchNumber;
        } catch (error) {
            logError('Failed to assign batch number', {
                doctorId,
                appointmentDate,
                appointmentTime,
                tokenNumber,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Process ETA-based batch notifications
     * This runs periodically to check if any batches should be triggered
     */
    static async processETABasedNotifications() {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Find appointments that need ETA-based notifications
            const pendingAppointments = await appointments.find({
                appointmentDate: {
                    $gte: today,
                    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                },
                status: 'Scheduled',
                batchStatus: { $in: ['pending', 'sent'] },
                patientAddress: { $exists: true, $ne: null }
            }).populate('patientId', 'addresses').populate('hospitalId', 'location name');

            logInfo('ETA batch processing started', {
                pendingAppointments: pendingAppointments.length,
                currentTime: now.toISOString()
            });

            const results = [];
            
            for (const appointment of pendingAppointments) {
                try {
                    const shouldTrigger = await this.shouldTriggerBatchNotification(appointment, now);
                    
                    if (shouldTrigger) {
                        const result = await this.triggerBatchNotification(appointment);
                        results.push(result);
                    }
                } catch (error) {
                    logError('Failed to process appointment for ETA notification', {
                        appointmentId: appointment.appointmentId,
                        error: error.message
                    });
                }
            }

            logInfo('ETA batch processing completed', {
                notificationsTriggered: results.length,
                results: results.map(r => ({
                    appointmentId: r.appointmentId,
                    batchNumber: r.batchNumber,
                    tokensSent: r.tokensSent
                }))
            });

            return {
                success: true,
                notificationsTriggered: results.length,
                results
            };

        } catch (error) {
            logError('ETA batch processing failed', { error: error.message });
            throw error;
        }
    }
    
    /**
     * Check if a batch notification should be triggered for an appointment
     * @param {Object} appointment - Appointment object
     * @param {Date} now - Current time
     */
    static async shouldTriggerBatchNotification(appointment, now) {
        try {
            // Skip if already sent and not in current batch
            if (appointment.batchStatus === 'sent' && !this.isCurrentBatch(appointment, now)) {
                return false;
            }

            // Get patient address
            let patientAddress = appointment.patientAddress;
            if (!patientAddress && appointment.patientId?.addresses) {
                const defaultAddress = appointment.patientId.addresses.find(addr => addr.isDefault) || appointment.patientId.addresses[0];
                if (defaultAddress) {
                    patientAddress = {
                        origin: defaultAddress.origin,
                        addressName: defaultAddress.addressName
                    };
                }
            }

            if (!patientAddress?.origin || !appointment.hospitalId?.location?.coordinates) {
                logInfo('Skipping appointment - missing location data', {
                    appointmentId: appointment.appointmentId,
                    hasPatientAddress: !!patientAddress?.origin,
                    hasHospitalLocation: !!appointment.hospitalId?.location?.coordinates
                });
                return false;
            }

            // Calculate ETA
            const etaResult = await getEta({
                origin: patientAddress.origin,
                destination: {
                    lat: appointment.hospitalId.location.coordinates[1],
                    lng: appointment.hospitalId.location.coordinates[0]
                },
                mode: 'driving',
                departureTime: 'now'
            });

            // Calculate appointment datetime
            const appointmentDateTime = new Date(appointment.appointmentDate);
            const [hours, minutes] = appointment.appointmentTime.split(':');
            appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Calculate suggested departure time
            const travelTimeMinutes = Math.ceil(etaResult.durationSeconds / 60);
            const suggestedDepartureTime = new Date(appointmentDateTime.getTime() - (travelTimeMinutes + this.BUFFER_MINUTES) * 60000);

            // Check if it's time to trigger
            const shouldTrigger = now >= suggestedDepartureTime;

            logInfo('ETA calculation for appointment', {
                appointmentId: appointment.appointmentId,
                appointmentTime: appointmentDateTime.toISOString(),
                travelTimeMinutes,
                suggestedDepartureTime: suggestedDepartureTime.toISOString(),
                currentTime: now.toISOString(),
                shouldTrigger
            });

            return shouldTrigger;

        } catch (error) {
            logError('Failed to check if batch notification should trigger', {
                appointmentId: appointment.appointmentId,
                error: error.message
            });
            return false;
        }
    }
    
    /**
     * Trigger batch notification for an appointment
     * @param {Object} appointment - Appointment object
     */
    static async triggerBatchNotification(appointment) {
        try {
            // Get patient address
            let patientAddress = appointment.patientAddress;
            if (!patientAddress && appointment.patientId?.addresses) {
                const defaultAddress = appointment.patientId.addresses.find(addr => addr.isDefault) || appointment.patientId.addresses[0];
                if (defaultAddress) {
                    patientAddress = {
                        origin: defaultAddress.origin,
                        addressName: defaultAddress.addressName
                    };
                }
            }

            // Calculate ETA
            const etaResult = await getEta({
                origin: patientAddress.origin,
                destination: {
                    lat: appointment.hospitalId.location.coordinates[1],
                    lng: appointment.hospitalId.location.coordinates[0]
                },
                mode: 'driving',
                departureTime: 'now'
            });

            const travelTimeMinutes = Math.ceil(etaResult.durationSeconds / 60);

            // Find user FCM tokens
            const userTokens = await UserToken.find({ 
                userId: appointment.patientId, 
                isActive: true 
            });

            if (userTokens.length === 0) {
                throw new Error(`No active FCM tokens found for patient ${appointment.patientId}`);
            }

            // Send notification to all active tokens
            for (const tokenDoc of userTokens) {
                await admin.messaging().send({
                    token: tokenDoc.fcmToken,
                    notification: {
                        title: 'Time to Leave!',
                        body: `Leave now to reach ${appointment.hospitalId.name} in ~${travelTimeMinutes} minutes. Your appointment is at ${appointment.appointmentTime}.`
                    },
                    data: {
                        appointmentId: appointment.appointmentId,
                        type: 'batch_departure_notification',
                        travelTimeMinutes: travelTimeMinutes.toString(),
                        batchNumber: appointment.batchNumber?.toString() || '1',
                        hospitalName: appointment.hospitalId.name,
                        deeplink: `app://appointment/${appointment.appointmentId}`
                    }
                });
            }

            // Update appointment status
            const appointmentDateTime = new Date(appointment.appointmentDate);
            const [hours, minutes] = appointment.appointmentTime.split(':');
            appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            await appointments.updateOne(
                { appointmentId: appointment.appointmentId },
                { 
                    batchStatus: 'sent',
                    suggestedArrivalAt: new Date(appointmentDateTime.getTime() - this.BUFFER_MINUTES * 60000)
                }
            );

            logInfo('Batch notification sent', {
                appointmentId: appointment.appointmentId,
                patientId: appointment.patientId,
                batchNumber: appointment.batchNumber,
                travelTimeMinutes,
                tokensSent: userTokens.length
            });

            return {
                appointmentId: appointment.appointmentId,
                patientId: appointment.patientId,
                batchNumber: appointment.batchNumber,
                travelTimeMinutes,
                tokensSent: userTokens.length
            };

        } catch (error) {
            logError('Failed to trigger batch notification', {
                appointmentId: appointment.appointmentId,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Check if an appointment is in the current active batch
     * @param {Object} appointment - Appointment object
     * @param {Date} now - Current time
     */
    static isCurrentBatch(appointment, now) {
        // This is a simplified version - in a full implementation,
        // you'd track which batch is currently active based on check-ins and no-shows
        const appointmentDateTime = new Date(appointment.appointmentDate);
        const [hours, minutes] = appointment.appointmentTime.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Consider current batch if appointment is within 30 minutes of now
        const timeDiff = Math.abs(appointmentDateTime.getTime() - now.getTime());
        return timeDiff <= 30 * 60 * 1000; // 30 minutes
    }
    
    /**
     * Handle check-in event - advance to next batch if needed
     * @param {string} appointmentId - Appointment ID that was checked in
     */
    static async handleCheckIn(appointmentId) {
        try {
            const appointment = await appointments.findOne({ appointmentId });
            if (!appointment) {
                throw new Error(`Appointment ${appointmentId} not found`);
            }

            // Update appointment status
            await appointments.updateOne(
                { appointmentId },
                { 
                    batchStatus: 'arrived',
                    isCheckedIn: true,
                    checkInTime: new Date()
                }
            );

            // Check if we should advance to next batch
            const shouldAdvance = await this.shouldAdvanceToNextBatch(appointment);
            
            if (shouldAdvance) {
                await this.advanceToNextBatch(appointment.doctorId, appointment.appointmentDate, appointment.appointmentTime);
            }

            logInfo('Check-in handled', {
                appointmentId,
                shouldAdvance,
                doctorId: appointment.doctorId
            });

            return {
                success: true,
                appointmentId,
                shouldAdvance,
                message: shouldAdvance ? 'Advanced to next batch' : 'Check-in processed'
            };

        } catch (error) {
            logError('Failed to handle check-in', {
                appointmentId,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Check if we should advance to the next batch
     * @param {Object} appointment - The appointment that was checked in
     */
    static async shouldAdvanceToNextBatch(appointment) {
        try {
            // Find other appointments in the same batch that haven't arrived
            const sameBatchAppointments = await appointments.find({
                doctorId: appointment.doctorId,
                appointmentDate: appointment.appointmentDate,
                batchNumber: appointment.batchNumber,
                batchStatus: { $in: ['sent', 'pending'] },
                appointmentId: { $ne: appointment.appointmentId }
            });

            // If this is the first person to check in from this batch, advance
            return sameBatchAppointments.length > 0;

        } catch (error) {
            logError('Failed to check if should advance to next batch', {
                appointmentId: appointment.appointmentId,
                error: error.message
            });
            return false;
        }
    }
    
    /**
     * Advance to the next batch for a doctor/slot
     * @param {string} doctorId - Doctor ID
     * @param {Date} appointmentDate - Appointment date
     * @param {string} appointmentTime - Appointment time
     */
    static async advanceToNextBatch(doctorId, appointmentDate, appointmentTime) {
        try {
            // Find the next batch appointments
            const currentBatch = await appointments.findOne({
                doctorId,
                appointmentDate,
                appointmentTime,
                batchStatus: 'sent'
            });

            if (!currentBatch) {
                logInfo('No current batch found to advance from', { doctorId, appointmentDate, appointmentTime });
                return;
            }

            const nextBatchNumber = currentBatch.batchNumber + 1;
            
            const nextBatchAppointments = await appointments.find({
                doctorId,
                appointmentDate,
                appointmentTime,
                batchNumber: nextBatchNumber,
                batchStatus: 'pending'
            });

            if (nextBatchAppointments.length === 0) {
                logInfo('No next batch appointments found', { 
                    doctorId, 
                    appointmentDate, 
                    appointmentTime, 
                    nextBatchNumber 
                });
                return;
            }

            // Trigger notifications for next batch
            const results = [];
            for (const appointment of nextBatchAppointments) {
                try {
                    const result = await this.triggerBatchNotification(appointment);
                    results.push(result);
                } catch (error) {
                    logError('Failed to trigger next batch notification', {
                        appointmentId: appointment.appointmentId,
                        error: error.message
                    });
                }
            }

            logInfo('Advanced to next batch', {
                doctorId,
                appointmentDate: appointmentDate.toISOString().split('T')[0],
                appointmentTime,
                nextBatchNumber,
                appointmentsTriggered: results.length
            });

            return {
                success: true,
                nextBatchNumber,
                appointmentsTriggered: results.length,
                results
            };

        } catch (error) {
            logError('Failed to advance to next batch', {
                doctorId,
                appointmentDate,
                appointmentTime,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Handle no-show detection and batch advancement
     * This runs periodically to check for no-shows
     */
    static async handleNoShows() {
        try {
            const now = new Date();
            const noShowThreshold = 10; // 10 minutes after suggested arrival time

            // Find appointments that are no-shows
            const noShowAppointments = await appointments.find({
                batchStatus: 'sent',
                suggestedArrivalAt: { $lt: new Date(now.getTime() - noShowThreshold * 60 * 1000) },
                isCheckedIn: { $ne: true }
            });

            logInfo('No-show detection started', {
                noShowAppointments: noShowAppointments.length,
                currentTime: now.toISOString()
            });

            const results = [];
            
            for (const appointment of noShowAppointments) {
                try {
                    // Mark as no-show
                    await appointments.updateOne(
                        { appointmentId: appointment.appointmentId },
                        { batchStatus: 'no_show' }
                    );

                    // Try to advance to next batch
                    const advanceResult = await this.advanceToNextBatch(
                        appointment.doctorId, 
                        appointment.appointmentDate, 
                        appointment.appointmentTime
                    );

                    results.push({
                        appointmentId: appointment.appointmentId,
                        patientId: appointment.patientId,
                        batchNumber: appointment.batchNumber,
                        advanced: !!advanceResult
                    });

                } catch (error) {
                    logError('Failed to handle no-show', {
                        appointmentId: appointment.appointmentId,
                        error: error.message
                    });
                }
            }

            logInfo('No-show detection completed', {
                noShowsDetected: results.length,
                results: results.map(r => ({
                    appointmentId: r.appointmentId,
                    batchNumber: r.batchNumber,
                    advanced: r.advanced
                }))
            });

            return {
                success: true,
                noShowsDetected: results.length,
                results
            };

        } catch (error) {
            logError('No-show detection failed', { error: error.message });
            throw error;
        }
    }
}
