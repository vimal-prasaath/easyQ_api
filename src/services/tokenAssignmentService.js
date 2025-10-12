import Appointment from '../model/appointment.js';
import Doctor from '../model/doctor.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logError, logInfo } from '../config/logger.js';

export class TokenAssignmentService {
    
    /**
     * Assign token number to an appointment
     * @param {string} doctorId - Doctor ID
     * @param {Date} appointmentDate - Appointment date
     * @param {string} appointmentTime - Appointment time (HH:MM)
     * @returns {Object} { slotNumber, tokenNumber, tokenDisplay }
     */
    static async assignToken(doctorId, appointmentDate, appointmentTime) {
        try {
            // Get doctor with working hours
            const doctor = await Doctor.findOne({ doctorId }).select('workingHours maxAppointment unlimitedToken');
            if (!doctor) {
                throw new EasyQError('NotFoundError', httpStatusCode.NOT_FOUND, true, `Doctor ${doctorId} not found`);
            }

            // Get day of week
            const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Find working hours for the day
            const dayWorkingHours = doctor.workingHours.find(wh => wh.day === dayOfWeek);
            if (!dayWorkingHours || !dayWorkingHours.timeSlots || dayWorkingHours.timeSlots.length === 0) {
                throw new EasyQError('ValidationError', httpStatusCode.BAD_REQUEST, true, `No working hours found for ${dayOfWeek}`);
            }

            // Determine slot number from appointment time
            const slotNumber = this.determineSlotNumber(appointmentTime, dayWorkingHours.timeSlots);
            if (!slotNumber) {
                throw new EasyQError('ValidationError', httpStatusCode.BAD_REQUEST, true, `Appointment time ${appointmentTime} does not match any available slot`);
            }

            // Calculate max tokens for this slot
            const slot = dayWorkingHours.timeSlots[slotNumber - 1];
            const slotDuration = this.getTimeDifferenceInMinutes(slot.startTime, slot.endTime);
            const standardDuration = 120; // 2 hours
            const maxTokens = doctor.unlimitedToken ? 
                Infinity : 
                Math.max(1, Math.floor((slotDuration / standardDuration) * parseInt(doctor.maxAppointment)));

            // Get next available token number for this slot and date
            const tokenNumber = await this.getNextTokenNumber(doctorId, appointmentDate, slotNumber, maxTokens);

            // Generate display format
            const tokenDisplay = `S${slotNumber}T${tokenNumber.toString().padStart(3, '0')}`;

            logInfo('Token assigned', {
                doctorId,
                appointmentDate: appointmentDate.toISOString().split('T')[0],
                appointmentTime,
                slotNumber,
                tokenNumber,
                tokenDisplay,
                maxTokens: doctor.unlimitedToken ? 'unlimited' : maxTokens
            });

            return { slotNumber, tokenNumber, tokenDisplay };

        } catch (error) {
            logError(error, { doctorId, appointmentDate, appointmentTime });
            throw error;
        }
    }

    /**
     * Determine slot number from appointment time
     * @param {string} appointmentTime - HH:MM format
     * @param {Array} timeSlots - Array of {startTime, endTime}
     * @returns {number|null} Slot number (1-based) or null if not found
     */
    static determineSlotNumber(appointmentTime, timeSlots) {
        const appointmentMinutes = this.timeToMinutes(appointmentTime);
        
        for (let i = 0; i < timeSlots.length; i++) {
            const slot = timeSlots[i];
            const startMinutes = this.timeToMinutes(slot.startTime);
            const endMinutes = this.timeToMinutes(slot.endTime);
            
            if (appointmentMinutes >= startMinutes && appointmentMinutes < endMinutes) {
                return i + 1; // 1-based slot numbering
            }
        }
        
        return null;
    }

    /**
     * Get next available token number for a slot
     * @param {string} doctorId - Doctor ID
     * @param {Date} appointmentDate - Appointment date
     * @param {number} slotNumber - Slot number (1-based)
     * @param {number} maxTokens - Maximum tokens for this slot
     * @returns {number} Next token number
     */
    static async getNextTokenNumber(doctorId, appointmentDate, slotNumber, maxTokens) {
        // Get start and end of day
        const startOfDay = new Date(appointmentDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(appointmentDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Count existing appointments in this slot
        const existingCount = await Appointment.countDocuments({
            doctorId,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            slotNumber
        });

        const nextTokenNumber = existingCount + 1;

        // Check if slot is full (unless unlimited)
        if (maxTokens !== Infinity && nextTokenNumber > maxTokens) {
            throw new EasyQError('ValidationError', httpStatusCode.BAD_REQUEST, true, 
                `Slot ${slotNumber} is full. Maximum ${maxTokens} appointments allowed.`);
        }

        return nextTokenNumber;
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
     * Get time difference in minutes
     * @param {string} startTime - HH:MM format
     * @param {string} endTime - HH:MM format
     * @returns {number} Difference in minutes
     */
    static getTimeDifferenceInMinutes(startTime, endTime) {
        return this.timeToMinutes(endTime) - this.timeToMinutes(startTime);
    }

    /**
     * Migrate existing appointments to add token numbers
     * @param {string} doctorId - Optional doctor ID to limit migration
     * @returns {Object} Migration results
     */
    static async migrateExistingAppointments(doctorId = null) {
        try {
            const query = { 
                slotNumber: { $exists: false }, // Only appointments without token numbers
                status: { $in: ['Scheduled', 'Confirmed'] } // Only active appointments
            };
            
            if (doctorId) {
                query.doctorId = doctorId;
            }

            const appointments = await Appointment.find(query).sort({ createdAt: 1 });
            let migrated = 0;
            let errors = 0;

            logInfo('Starting token migration', { 
                totalAppointments: appointments.length,
                doctorId: doctorId || 'all'
            });

            for (const appointment of appointments) {
                try {
                    const { slotNumber, tokenNumber, tokenDisplay } = await this.assignToken(
                        appointment.doctorId,
                        appointment.appointmentDate,
                        appointment.appointmentTime
                    );

                    await Appointment.findByIdAndUpdate(appointment._id, {
                        slotNumber,
                        tokenNumber,
                        tokenDisplay
                    });

                    migrated++;
                } catch (error) {
                    logError(error, { 
                        appointmentId: appointment._id,
                        doctorId: appointment.doctorId,
                        appointmentDate: appointment.appointmentDate,
                        appointmentTime: appointment.appointmentTime
                    });
                    errors++;
                }
            }

            const result = { migrated, errors, total: appointments.length };
            logInfo('Token migration completed', result);
            return result;

        } catch (error) {
            logError(error, { doctorId });
            throw error;
        }
    }
}
