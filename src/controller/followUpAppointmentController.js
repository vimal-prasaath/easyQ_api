import { FollowUpAppointmentService } from '../services/followUpAppointmentService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';
import { calculateUserHospitalDistance, calculateApproximateTravelTime } from '../util/distanceCalculator.js';
import User from '../model/userProfile.js';

/**
 * Create a follow-up appointment
 * POST /api/appointment/follow-up
 */
export const createFollowUpAppointment = async (req, res, next) => {
    try {
        const followUpData = req.body;

        const newFollowUpAppointment = await FollowUpAppointmentService.createFollowUpAppointment(followUpData);

        logInfo('Follow-up appointment created via API', {
            appointmentId: newFollowUpAppointment.appointmentId,
            patientId: followUpData.patientId,
            doctorId: followUpData.doctorId,
            parentAppointmentId: followUpData.parentAppointmentId
        });

        return res.status(httpStatusCode.CREATED).json({
            status: 'success',
            message: 'Follow-up appointment created successfully',
            data: {
                appointmentId: newFollowUpAppointment.appointmentId,
                patientId: newFollowUpAppointment.patientId,
                doctorId: newFollowUpAppointment.doctorId,
                hospitalId: newFollowUpAppointment.hospitalId,
                appointmentDate: newFollowUpAppointment.appointmentDate,
                appointmentTime: newFollowUpAppointment.appointmentTime,
                status: newFollowUpAppointment.status,
                tokenDisplay: newFollowUpAppointment.tokenDisplay,
                followUp: newFollowUpAppointment.followUp,
                createdAt: newFollowUpAppointment.createdAt
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/appointment/follow-up',
            followUpData: req.body
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to create follow-up appointment'
        ));
    }
};

/**
 * Get follow-up appointments for a patient
 * GET /api/appointment/follow-up/patient/{patientId}
 */
export const getFollowUpAppointmentsByPatient = async (req, res, next) => {
    try {
        const { patientId } = req.params;

        if (!patientId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Patient ID is required'
            );
        }

        const followUpAppointments = await FollowUpAppointmentService.getFollowUpAppointmentsByPatient(patientId);

        // Add distance and travel time calculation for each follow-up appointment
        if (followUpAppointments && followUpAppointments.length > 0) {
            // Get user data for distance calculation
            const user = await User.findOne({ userId: patientId });
            
            if (user) {
                // Get unique hospital IDs to fetch hospital data
                const hospitalIds = [...new Set(followUpAppointments.map(apt => apt.hospitalId))];
                const Hospital = (await import('../model/hospital.js')).default;
                const hospitals = await Hospital.find({ hospitalId: { $in: hospitalIds } });
                const hospitalMap = {};
                hospitals.forEach(hospital => {
                    hospitalMap[hospital.hospitalId] = hospital;
                });

                // Add distance and travel time to each follow-up appointment
                await Promise.all(followUpAppointments.map(async appointment => {
                    const hospital = hospitalMap[appointment.hospitalId];
                    if (hospital) {
                        const distance = calculateUserHospitalDistance(user, hospital);
                        const approximateTime = await calculateApproximateTravelTime(user, hospital);
                        appointment.distance = distance; // Add distance to the appointment data
                        appointment.approximateTime = approximateTime; // Add travel time to the appointment data
                    }
                }));
            }
        }

        logInfo('Follow-up appointments retrieved for patient', {
            patientId,
            count: followUpAppointments.length
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Follow-up appointments retrieved successfully',
            data: {
                patientId,
                followUpAppointments,
                totalFollowUps: followUpAppointments.length
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/appointment/follow-up/patient',
            patientId: req.params?.patientId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve follow-up appointments'
        ));
    }
};

/**
 * Get follow-up appointments for a doctor
 * GET /api/appointment/follow-up/doctor/{doctorId}
 */
export const getFollowUpAppointmentsByDoctor = async (req, res, next) => {
    try {
        const { doctorId } = req.params;

        if (!doctorId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required'
            );
        }

        const followUpAppointments = await FollowUpAppointmentService.getFollowUpAppointmentsByDoctor(doctorId);

        logInfo('Follow-up appointments retrieved for doctor', {
            doctorId,
            count: followUpAppointments.length
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Follow-up appointments retrieved successfully',
            data: {
                doctorId,
                followUpAppointments,
                totalFollowUps: followUpAppointments.length
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/appointment/follow-up/doctor',
            doctorId: req.params?.doctorId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve follow-up appointments'
        ));
    }
};

/**
 * Get follow-up appointments for a hospital
 * GET /api/appointment/follow-up/hospital/{hospitalId}
 */
export const getFollowUpAppointmentsByHospital = async (req, res, next) => {
    try {
        const { hospitalId } = req.params;

        if (!hospitalId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required'
            );
        }

        const followUpAppointments = await FollowUpAppointmentService.getFollowUpAppointmentsByHospital(hospitalId);

        logInfo('Follow-up appointments retrieved for hospital', {
            hospitalId,
            count: followUpAppointments.length
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Follow-up appointments retrieved successfully',
            data: {
                hospitalId,
                followUpAppointments,
                totalFollowUps: followUpAppointments.length
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/appointment/follow-up/hospital',
            hospitalId: req.params?.hospitalId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve follow-up appointments'
        ));
    }
};

/**
 * Get follow-up appointments created by a specific user
 * GET /api/appointment/follow-up/creator/{createdBy}/{createdById}
 */
export const getFollowUpAppointmentsByCreator = async (req, res, next) => {
    try {
        const { createdBy, createdById } = req.params;

        if (!createdBy || !createdById) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Created by and created by ID are required'
            );
        }

        // Validate createdBy enum
        if (!['admin', 'doctor', 'nurse'].includes(createdBy)) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Created by must be one of: admin, doctor, nurse'
            );
        }

        const followUpAppointments = await FollowUpAppointmentService.getFollowUpAppointmentsByCreator(createdBy, createdById);

        logInfo('Follow-up appointments retrieved by creator', {
            createdBy,
            createdById,
            count: followUpAppointments.length
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Follow-up appointments retrieved successfully',
            data: {
                createdBy,
                createdById,
                followUpAppointments,
                totalFollowUps: followUpAppointments.length
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/appointment/follow-up/creator',
            createdBy: req.params?.createdBy,
            createdById: req.params?.createdById
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve follow-up appointments'
        ));
    }
};
