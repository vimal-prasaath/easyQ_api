import Appointment from '../model/appointment.js';
import Doctor from '../model/doctor.js';
import Hospital from '../model/hospital/index.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

export class SuggestionService {
    
    static async getSimilarAppointmentSuggestions(patientId, currentAppointment = {}) {
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
                return {
                    suggestions: [],
                    message: 'No past appointments found for suggestions'
                };
            }

            const suggestions = [];
            const addedDoctorHospitalPairs = new Set();

            for (const appt of pastCompletedAppointments) {
                const suggestionKey = `${appt.doctorId}-${appt.hospitalId}-${appt.appointmentType}`;
                if (!addedDoctorHospitalPairs.has(suggestionKey)) {
                    addedDoctorHospitalPairs.add(suggestionKey);

                    const doctor = await Doctor.findOne({ doctorId: appt.doctorId })
                        .select('name specialization');
                    const hospital = await Hospital.findOne({ hospitalId: appt.hospitalId })
                        .select('name address');

                    if (doctor && hospital) {
                        suggestions.push({
                            type: appt.appointmentType,
                            doctor: {
                                id: appt.doctorId,
                                name: doctor.name,
                                specialization: doctor.specialization
                            },
                            hospital: {
                                id: appt.hospitalId,
                                name: hospital.name,
                                address: hospital.address
                            },
                            lastVisitDate: appt.appointmentDate,
                            reason: appt.reason || 'General consultation',
                            priority: this.calculatePriority(appt.appointmentDate, appt.appointmentType)
                        });
                    }
                }

                if (suggestions.length >= 5) break;
            }

            return {
                suggestions,
                message: 'Appointment suggestions retrieved successfully'
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to get appointment suggestions: ${error.message}`
            );
        }
    }

    static async getDoctorSuggestions(patientId, specialization = null) {
        try {
            const recentAppointments = await Appointment.find({
                patientId: patientId,
                status: { $in: ['Completed', 'Upcoming'] }
            })
            .sort({ appointmentDate: -1 })
            .limit(20)
            .lean();

            const frequentDoctors = {};
            const frequentSpecializations = {};

            recentAppointments.forEach(appt => {
                frequentDoctors[appt.doctorId] = (frequentDoctors[appt.doctorId] || 0) + 1;
                if (appt.specialization) {
                    frequentSpecializations[appt.specialization] = (frequentSpecializations[appt.specialization] || 0) + 1;
                }
            });

            const query = {};
            if (specialization) {
                query.specialization = specialization;
            } else {
                const topSpecializations = Object.keys(frequentSpecializations)
                    .sort((a, b) => frequentSpecializations[b] - frequentSpecializations[a])
                    .slice(0, 3);
                if (topSpecializations.length > 0) {
                    query.specialization = { $in: topSpecializations };
                }
            }

            const doctors = await Doctor.find(query)
                .select('doctorId name specialization experience rating')
                .limit(10)
                .lean();

            const suggestions = doctors.map(doctor => ({
                doctor: {
                    id: doctor.doctorId,
                    name: doctor.name,
                    specialization: doctor.specialization,
                    experience: doctor.experience,
                    rating: doctor.rating
                },
                visitCount: frequentDoctors[doctor.doctorId] || 0,
                isFrequent: (frequentDoctors[doctor.doctorId] || 0) > 2
            }));

            return {
                suggestions,
                message: 'Doctor suggestions retrieved successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to get doctor suggestions: ${error.message}`
            );
        }
    }

    static async getHospitalSuggestions(patientId, city = null) {
        try {
            const recentAppointments = await Appointment.find({
                patientId: patientId,
                status: { $in: ['Completed', 'Upcoming'] }
            })
            .sort({ appointmentDate: -1 })
            .limit(20)
            .lean();

            const frequentHospitals = {};
            recentAppointments.forEach(appt => {
                frequentHospitals[appt.hospitalId] = (frequentHospitals[appt.hospitalId] || 0) + 1;
            });

            const query = {};
            if (city) {
                query['address.city'] = new RegExp(city, 'i');
            }

            const hospitals = await Hospital.find(query)
                .select('hospitalId name address rating facilities')
                .limit(10)
                .lean();

            const suggestions = hospitals.map(hospital => ({
                hospital: {
                    id: hospital.hospitalId,
                    name: hospital.name,
                    address: hospital.address,
                    rating: hospital.rating,
                    facilities: hospital.facilities
                },
                visitCount: frequentHospitals[hospital.hospitalId] || 0,
                isFrequent: (frequentHospitals[hospital.hospitalId] || 0) > 2
            }));

            return {
                suggestions,
                message: 'Hospital suggestions retrieved successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to get hospital suggestions: ${error.message}`
            );
        }
    }

    static async getAppointmentTimeSuggestions(patientId, doctorId) {
        try {
            const pastAppointments = await Appointment.find({
                patientId: patientId,
                ...(doctorId && { doctorId: doctorId }),
                status: 'Completed'
            })
            .select('appointmentTime appointmentDate')
            .sort({ appointmentDate: -1 })
            .limit(10)
            .lean();

            const timeFrequency = {};
            const dayFrequency = {};

            pastAppointments.forEach(appt => {
                const time = appt.appointmentTime;
                const dayOfWeek = new Date(appt.appointmentDate).toLocaleDateString('en-US', { weekday: 'long' });
                
                timeFrequency[time] = (timeFrequency[time] || 0) + 1;
                dayFrequency[dayOfWeek] = (dayFrequency[dayOfWeek] || 0) + 1;
            });

            const preferredTimes = Object.entries(timeFrequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([time, count]) => ({ time, frequency: count }));

            const preferredDays = Object.entries(dayFrequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([day, count]) => ({ day, frequency: count }));

            return {
                suggestions: {
                    preferredTimes,
                    preferredDays
                },
                message: 'Appointment time suggestions retrieved successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to get appointment time suggestions: ${error.message}`
            );
        }
    }

    static calculatePriority(lastVisitDate, appointmentType) {
        const daysSinceVisit = (Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24);
        
        let priority = 'Medium';
        
        if (appointmentType === 'Follow-up' && daysSinceVisit > 90) {
            priority = 'High';
        } else if (appointmentType === 'Routine' && daysSinceVisit > 365) {
            priority = 'High';
        } else if (daysSinceVisit < 30) {
            priority = 'Low';
        }
        
        return priority;
    }

    static async getPersonalizedSuggestions(patientId, options = {}) {
        try {
            const { includeAppointments = true, includeDoctors = true, includeHospitals = true, includeTimeSlots = true } = options;
            
            const suggestions = {};

            if (includeAppointments) {
                suggestions.appointments = await this.getSimilarAppointmentSuggestions(patientId);
            }

            if (includeDoctors) {
                suggestions.doctors = await this.getDoctorSuggestions(patientId);
            }

            if (includeHospitals) {
                suggestions.hospitals = await this.getHospitalSuggestions(patientId);
            }

            if (includeTimeSlots) {
                suggestions.timeSlots = await this.getAppointmentTimeSuggestions(patientId);
            }

            return {
                suggestions,
                message: 'Personalized suggestions retrieved successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to get personalized suggestions: ${error.message}`
            );
        }
    }
}