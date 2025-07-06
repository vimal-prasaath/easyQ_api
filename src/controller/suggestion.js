import Appointment from '../model/appointment.js';
import Doctor from '../model/doctor.js';
import Hospital from '../model/hospital/index.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

export async function getSimilarAppointmentSuggestions(patientId, currentAppointment = {}) {
    try {
        if (!patientId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Patient ID is required to get appointment suggestions.'
            );
        }

        const pastCompletedAppointments = await Appointment.find({
            patientId: patientId,
            status: 'Completed',
            ...(currentAppointment.appointmentId && { appointmentId: { $ne: currentAppointment.appointmentId } }),
        })
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .limit(10)
        .lean();

        if (pastCompletedAppointments.length === 0) {
            return [];
        }

        const suggestions = [];
        const addedDoctorHospitalPairs = new Set();

        for (const appt of pastCompletedAppointments) {
            const suggestionKey = `${appt.doctorId}-${appt.hospitalId}-${appt.appointmentType}`;
            if (!addedDoctorHospitalPairs.has(suggestionKey)) {
                addedDoctorHospitalPairs.add(suggestionKey);

                const doctor = await Doctor.findOne({ doctorId: appt.doctorId }).select('name specialization');
                const hospital = await Hospital.findOne({ hospitalId: appt.hospitalId }).select('name address');

                if (doctor && hospital) {
                    suggestions.push({
                        type: appt.appointmentType,
                        doctor: {
                            id: doctor.doctorId,
                            name: doctor.name,
                            specialization: doctor.specialization
                        },
                        hospital: {
                            id: hospital.hospitalId,
                            name: hospital.name,
                            address: hospital.address
                        },
                    
                    });
                }
                if (suggestions.length >= 3) {
                    break;
                }
            }
        }

        return suggestions;

    } catch (error) {
        if (error instanceof EasyQError) {
            throw error;
        }
        if (error.name === 'CastError') {
            throw new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid ID format provided for patient or appointment.`
            );
        }
        throw new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error generating appointment suggestions: ${error.message}`
        );
    }
}