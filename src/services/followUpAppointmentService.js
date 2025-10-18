import Appointment from '../model/appointment.js';
import User from '../model/userProfile.js';
import Doctor from '../model/doctor.js';
import Hospital from '../model/hospital.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';
import { TokenAssignmentService } from './tokenAssignmentService.js';

export class FollowUpAppointmentService {

    /**
     * Create a follow-up appointment
     * @param {Object} followUpData - Follow-up appointment data
     * @returns {Object} Created follow-up appointment
     */
    static async createFollowUpAppointment(followUpData) {
        try {
            const {
                patientId,
                doctorId,
                hospitalId,
                appointmentDate,
                appointmentTime,
                followUpReason,
                createdBy,
                createdById,
                parentAppointmentId,
                notes,
                consultationType
            } = followUpData;

            // Validate required fields
            if (!patientId || !doctorId || !hospitalId || !appointmentDate || !appointmentTime || 
                !followUpReason || !createdBy || !createdById || !parentAppointmentId) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Required fields: patientId, doctorId, hospitalId, appointmentDate, appointmentTime, followUpReason, createdBy, createdById, parentAppointmentId'
                );
            }

            // Validate parent appointment exists and is completed
            const parentAppointment = await Appointment.findOne({ appointmentId: parentAppointmentId });
            if (!parentAppointment) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Parent appointment not found'
                );
            }

            // Check if parent appointment is in a completed state using checkInStatus
            const completedStatuses = ['Completed', 'Checked-out', 'Finished'];
            if (!completedStatuses.includes(parentAppointment.checkInStatus)) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Parent appointment must be completed before creating follow-up. Current checkInStatus: ${parentAppointment.checkInStatus}`
                );
            }

            // Validate patient exists
            const patient = await User.findOne({ userId: patientId });
            if (!patient) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Patient ${patientId} not found`
                );
            }

            // Validate doctor exists
            const doctor = await Doctor.findOne({ doctorId });
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Doctor ${doctorId} not found`
                );
            }

            // Validate hospital exists
            const hospital = await Hospital.findOne({ hospitalId });
            if (!hospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Hospital ${hospitalId} not found`
                );
            }

            // Parse appointment date
            const appointmentDateObj = new Date(appointmentDate);
            if (isNaN(appointmentDateObj.getTime())) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Invalid appointment date format'
                );
            }

            // Copy patient address from parent appointment
            let patientAddress = null;
            if (parentAppointment.patientAddress) {
                patientAddress = parentAppointment.patientAddress;
            } else if (patient.addresses && patient.addresses.length > 0) {
                // Fallback to patient's default address
                const defaultAddress = patient.addresses.find(addr => addr.isDefault) || patient.addresses[0];
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

            // Assign token number
            const tokenInfo = await TokenAssignmentService.assignToken(
                doctorId,
                appointmentDateObj,
                appointmentTime
            );

            // Assign batch number
            const { BatchOrchestrator } = await import('./batchOrchestrator.js');
            const batchNumber = await BatchOrchestrator.assignBatchNumber(
                doctorId,
                appointmentDateObj,
                appointmentTime,
                tokenInfo.tokenNumber
            );

            // Create follow-up appointment data
            const followUpAppointmentData = {
                patientId,
                doctorId,
                hospitalId,
                appointmentDate: appointmentDateObj,
                appointmentTime,
                status: 'Scheduled',
                consultationType: consultationType || 'Follow-up',
                notes: notes || `Follow-up: ${followUpReason}`,
                hospitalName: hospital.name,
                doctorName: doctor.name,
                patientName: patient.name,
                patientPhone: patient.phoneNumber,
                patientEmail: patient.email,
                
                // Required appointment fields
                appointmentType: 'followup',
                paymentStatus: 'Pending',
                reasonForAppointment: followUpReason,
                
                // Token information
                slotNumber: tokenInfo.slotNumber,
                tokenNumber: tokenInfo.tokenNumber,
                tokenDisplay: tokenInfo.tokenDisplay,
                
                // Batch information
                batchNumber,
                batchStatus: 'pending',
                
                // Patient address
                patientAddress,
                
                // Follow-up specific fields
                followUp: {
                    isFollowUp: true,
                    parentAppointmentId,
                    followUpReason,
                    createdBy,
                    createdById
                }
            };

            // Create the follow-up appointment
            const newFollowUpAppointment = await Appointment.create(followUpAppointmentData);

            logInfo('Follow-up appointment created', {
                appointmentId: newFollowUpAppointment.appointmentId,
                patientId,
                doctorId,
                parentAppointmentId,
                followUpReason,
                createdBy,
                createdById
            });

            // Send follow-up notification
            try {
                const { NotificationOrchestrator } = await import('./notificationOrchestrator.js');
                await NotificationOrchestrator.sendFollowUpNotification(
                    patientId,
                    newFollowUpAppointment.appointmentId,
                    followUpReason,
                    appointmentDate,
                    appointmentTime
                );
            } catch (notificationError) {
                logError('Failed to send follow-up notification', {
                    appointmentId: newFollowUpAppointment.appointmentId,
                    patientId,
                    error: notificationError.message
                });
                // Don't throw - appointment creation should succeed even if notification fails
            }

            // Send appointment booking notification for follow-up
            try {
                const { NotificationOrchestrator } = await import('./notificationOrchestrator.js');
                await NotificationOrchestrator.sendAppointmentBookingNotification(
                    patientId,
                    newFollowUpAppointment.appointmentId,
                    hospital.name,
                    appointmentDate,
                    appointmentTime
                );
            } catch (notificationError) {
                logError('Failed to send follow-up appointment booking notification', {
                    appointmentId: newFollowUpAppointment.appointmentId,
                    patientId,
                    error: notificationError.message
                });
                // Don't throw - appointment creation should succeed even if notification fails
            }

            return newFollowUpAppointment;

        } catch (error) {
            logError('Error creating follow-up appointment', {
                error: error.message,
                followUpData
            });
            throw error;
        }
    }

    /**
     * Get follow-up appointments for a patient
     * @param {string} patientId - Patient ID
     * @returns {Array} Follow-up appointments
     */
    static async getFollowUpAppointmentsByPatient(patientId) {
        try {
            const followUpAppointments = await Appointment.find({
                patientId,
                'followUp.isFollowUp': true
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .lean();

            return followUpAppointments;

        } catch (error) {
            logError('Error getting follow-up appointments by patient', {
                error: error.message,
                patientId
            });
            throw error;
        }
    }

    /**
     * Get follow-up appointments for a doctor
     * @param {string} doctorId - Doctor ID
     * @returns {Array} Follow-up appointments
     */
    static async getFollowUpAppointmentsByDoctor(doctorId) {
        try {
            const followUpAppointments = await Appointment.find({
                doctorId,
                'followUp.isFollowUp': true
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .lean();

            return followUpAppointments;

        } catch (error) {
            logError('Error getting follow-up appointments by doctor', {
                error: error.message,
                doctorId
            });
            throw error;
        }
    }

    /**
     * Get follow-up appointments for a hospital
     * @param {string} hospitalId - Hospital ID
     * @returns {Array} Follow-up appointments
     */
    static async getFollowUpAppointmentsByHospital(hospitalId) {
        try {
            const followUpAppointments = await Appointment.find({
                hospitalId,
                'followUp.isFollowUp': true
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .lean();

            return followUpAppointments;

        } catch (error) {
            logError('Error getting follow-up appointments by hospital', {
                error: error.message,
                hospitalId
            });
            throw error;
        }
    }

    /**
     * Get follow-up appointments created by a specific user
     * @param {string} createdBy - Creator type (admin/doctor/nurse)
     * @param {string} createdById - Creator ID
     * @returns {Array} Follow-up appointments
     */
    static async getFollowUpAppointmentsByCreator(createdBy, createdById) {
        try {
            const followUpAppointments = await Appointment.find({
                'followUp.isFollowUp': true,
                'followUp.createdBy': createdBy,
                'followUp.createdById': createdById
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .lean();

            return followUpAppointments;

        } catch (error) {
            logError('Error getting follow-up appointments by creator', {
                error: error.message,
                createdBy,
                createdById
            });
            throw error;
        }
    }
}
