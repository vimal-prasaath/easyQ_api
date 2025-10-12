import Doctor from '../model/doctor.js';
import Appointment from '../model/appointment.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';

export class DoctorDelayService {

    /**
     * Set a delay for a doctor
     * @param {string} doctorId - Doctor ID
     * @param {Object} delayData - Delay information
     * @returns {Object} Created delay
     */
    static async setDelay(doctorId, delayData) {
        try {
            const { date, startTime, durationMinutes, reason, createdBy } = delayData;

            // Validate inputs
            if (!doctorId || !date || !startTime || !durationMinutes || !reason || !createdBy) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'All fields are required: doctorId, date, startTime, durationMinutes, reason, createdBy'
                );
            }

            // Parse date
            const delayDate = new Date(date);
            if (isNaN(delayDate.getTime())) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Invalid date format'
                );
            }

            // Get doctor
            const doctor = await Doctor.findOne({ doctorId });
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Doctor ${doctorId} not found`
                );
            }

            // Check if delay already exists for this time
            const existingDelay = doctor.delays.find(d => 
                d.date.getTime() === delayDate.getTime() && 
                d.startTime === startTime && 
                d.isActive
            );

            if (existingDelay) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Active delay already exists for this date and time'
                );
            }

            // Create delay object
            const newDelay = {
                date: delayDate,
                startTime,
                durationMinutes,
                reason,
                isActive: true,
                createdAt: new Date(),
                createdBy
            };

            // Add delay to doctor
            doctor.delays.push(newDelay);
            await doctor.save();

            // Calculate affected appointments
            const affectedAppointments = await this.calculateAffectedAppointments(doctorId, delayDate, startTime);

            logInfo('Doctor delay set', {
                doctorId,
                date: delayDate.toISOString().split('T')[0],
                startTime,
                durationMinutes,
                reason,
                createdBy,
                affectedAppointments: affectedAppointments.length
            });

            // Send delay notifications to affected patients
            try {
                const { NotificationOrchestrator } = await import('./notificationOrchestrator.js');
                await NotificationOrchestrator.sendDoctorDelayNotification(doctorId, durationMinutes, reason);
            } catch (error) {
                logError('Failed to send delay notifications', {
                    doctorId,
                    durationMinutes,
                    error: error.message
                });
                // Don't throw - delay setting should succeed even if notifications fail
            }

            return {
                delay: newDelay,
                affectedAppointments: affectedAppointments.length,
                message: `Delay set successfully. ${affectedAppointments.length} appointments will be affected.`
            };

        } catch (error) {
            logError(error, { doctorId, delayData });
            throw error;
        }
    }

    /**
     * Get active delays for a doctor
     * @param {string} doctorId - Doctor ID
     * @param {Date} date - Optional specific date
     * @returns {Array} Active delays
     */
    static async getActiveDelays(doctorId, date = null) {
        try {
            const doctor = await Doctor.findOne({ doctorId }).select('delays');
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Doctor ${doctorId} not found`
                );
            }

            let delays = doctor.delays.filter(d => d.isActive);

            if (date) {
                const targetDate = new Date(date);
                delays = delays.filter(d => d.date.getTime() === targetDate.getTime());
            }

            return delays;

        } catch (error) {
            logError(error, { doctorId, date });
            throw error;
        }
    }

    /**
     * Clear all delays for a doctor
     * @param {string} doctorId - Doctor ID
     * @param {Date} date - Optional specific date
     * @returns {Object} Clear result
     */
    static async clearDelays(doctorId, date = null) {
        try {
            const doctor = await Doctor.findOne({ doctorId });
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Doctor ${doctorId} not found`
                );
            }

            let clearedCount = 0;

            if (date) {
                // Clear delays for specific date
                const targetDate = new Date(date);
                doctor.delays.forEach(delay => {
                    if (delay.date.getTime() === targetDate.getTime() && delay.isActive) {
                        delay.isActive = false;
                        clearedCount++;
                    }
                });
            } else {
                // Clear all active delays
                doctor.delays.forEach(delay => {
                    if (delay.isActive) {
                        delay.isActive = false;
                        clearedCount++;
                    }
                });
            }

            await doctor.save();

            logInfo('Doctor delays cleared', {
                doctorId,
                date: date ? date.toISOString().split('T')[0] : 'all',
                clearedCount
            });

            return {
                clearedCount,
                message: `Cleared ${clearedCount} delay(s) for doctor ${doctorId}`
            };

        } catch (error) {
            logError(error, { doctorId, date });
            throw error;
        }
    }

    /**
     * Reset all doctor availability (end of day)
     * @param {string} doctorId - Optional specific doctor ID
     * @returns {Object} Reset result
     */
    static async resetAvailability(doctorId = null) {
        try {
            const query = doctorId ? { doctorId } : {};
            const doctors = await Doctor.find(query);

            let totalCleared = 0;
            const results = [];

            for (const doctor of doctors) {
                let clearedCount = 0;
                doctor.delays.forEach(delay => {
                    if (delay.isActive) {
                        delay.isActive = false;
                        clearedCount++;
                    }
                });

                if (clearedCount > 0) {
                    await doctor.save();
                    totalCleared += clearedCount;
                    results.push({
                        doctorId: doctor.doctorId,
                        clearedCount
                    });
                }
            }

            logInfo('Doctor availability reset', {
                doctorId: doctorId || 'all',
                totalCleared,
                affectedDoctors: results.length
            });

            return {
                totalCleared,
                affectedDoctors: results.length,
                results
            };

        } catch (error) {
            logError(error, { doctorId });
            throw error;
        }
    }

    /**
     * Calculate which appointments are affected by a delay
     * @param {string} doctorId - Doctor ID
     * @param {Date} date - Delay date
     * @param {string} startTime - Delay start time
     * @returns {Array} Affected appointments
     */
    static async calculateAffectedAppointments(doctorId, date, startTime) {
        try {
            // Get doctor's working hours for the day
            const doctor = await Doctor.findOne({ doctorId }).select('workingHours');
            if (!doctor) return [];

            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dayWorkingHours = doctor.workingHours.find(wh => wh.day === dayOfWeek);
            if (!dayWorkingHours || !dayWorkingHours.timeSlots) return [];

            // Find which slots are affected (slots starting at or after startTime)
            const affectedSlots = [];
            dayWorkingHours.timeSlots.forEach((slot, index) => {
                if (slot.startTime >= startTime) {
                    affectedSlots.push({
                        slotNumber: index + 1,
                        startTime: slot.startTime,
                        endTime: slot.endTime
                    });
                }
            });

            // Get appointments in affected slots
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const appointments = await Appointment.find({
                doctorId,
                appointmentDate: { $gte: startOfDay, $lte: endOfDay },
                appointmentTime: { $in: affectedSlots.map(s => s.startTime) },
                status: { $in: ['Scheduled', 'Confirmed'] }
            }).select('appointmentId patientId appointmentTime slotNumber tokenDisplay');

            return appointments;

        } catch (error) {
            logError(error, { doctorId, date, startTime });
            return [];
        }
    }

    /**
     * Get adjusted appointment time considering delays
     * @param {string} doctorId - Doctor ID
     * @param {Date} appointmentDate - Appointment date
     * @param {string} originalTime - Original appointment time
     * @returns {Object} Adjusted time information
     */
    static async getAdjustedTime(doctorId, appointmentDate, originalTime) {
        try {
            const delays = await this.getActiveDelays(doctorId, appointmentDate);
            
            if (delays.length === 0) {
                return {
                    adjustedTime: originalTime,
                    totalDelayMinutes: 0,
                    delays: []
                };
            }

            // Calculate total delay for this appointment time
            let totalDelayMinutes = 0;
            const applicableDelays = [];

            delays.forEach(delay => {
                if (originalTime >= delay.startTime) {
                    totalDelayMinutes += delay.durationMinutes;
                    applicableDelays.push(delay);
                }
            });

            if (totalDelayMinutes === 0) {
                return {
                    adjustedTime: originalTime,
                    totalDelayMinutes: 0,
                    delays: []
                };
            }

            // Calculate adjusted time
            const originalMinutes = this.timeToMinutes(originalTime);
            const adjustedMinutes = originalMinutes + totalDelayMinutes;
            const adjustedTime = this.minutesToTime(adjustedMinutes);

            return {
                adjustedTime,
                totalDelayMinutes,
                delays: applicableDelays
            };

        } catch (error) {
            logError(error, { doctorId, appointmentDate, originalTime });
            return {
                adjustedTime: originalTime,
                totalDelayMinutes: 0,
                delays: []
            };
        }
    }

    /**
     * Convert time string to minutes
     * @param {string} time - HH:MM format
     * @returns {number} Minutes since midnight
     */
    static timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Convert minutes to time string
     * @param {number} minutes - Minutes since midnight
     * @returns {string} HH:MM format
     */
    static minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
}
