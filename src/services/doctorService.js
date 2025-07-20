
import Doctor from '../model/doctor.js';
import Hospital from '../model/hospital.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

export class DoctorService {
    
    static async createDoctor(doctorData) {
        try {
            const hospitalData = await Hospital.findOne({ hospitalId: doctorData.hospitalId });
            if (!hospitalData) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Hospital with ID ${doctorData.hospitalId} not found. Cannot create doctor.`
                );
            }

            const doctor = await Doctor.create(doctorData);
            const specializationName = doctor.specialization;
            const shouldBeHead = doctorData.isHeadOfDepartment === true;

             let department = hospitalData.departments.find(
                dep => dep.name.toLowerCase() === specializationName.toLowerCase()
            );
            if (department) {
                   if (!department.doctorIds) {
                    department.doctorIds = [];
                    }
                if (!department.doctorIds.some(id => id === doctor.doctorId)) {
                    department.doctorIds.push(doctor.doctorId);
                    if (typeof department.total_number_Doctor === 'string') {
                         department.total_number_Doctor = (parseInt(department.total_number_Doctor || '0', 10) + 1).toString();
                    } else {
                         department.total_number_Doctor = (department.total_number_Doctor || 0) + 1;
                    }
                }
                 if (shouldBeHead) {
                    department.headOfDepartment = doctor.name; 
                }
            } else {
                hospitalData.departments.push({
                    name: specializationName,
                    doctorIds: [doctor.doctorId], 
                    total_number_Doctor: '1', 
                    headOfDepartment: shouldBeHead ? doctor.name : '',
                    contactNumber: '',    
                    description: '',      
                });
            }
            await hospitalData.save();
           
            return {
                doctor: doctor,
                doctorId: doctor.doctorId,
                experience:doctor.experienceYears
            };
        } catch (error) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            if (error.code === 11000) {
                throw new EasyQError(
                    'DuplicateError',
                    httpStatusCode.CONFLICT,
                    true,
                    'A doctor with this information already exists.'
                );
            }
            throw error;
        }
    }

    static async getDoctorById(doctorId) {
        try {
            const doctor = await Doctor.findOne({ doctorId: doctorId }).select('-_id -__v');
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Doctor not found.'
                );
            }
            return doctor;
        } catch (error) {
            if (error.name === 'CastError') {
                throw new EasyQError(
                    'InvalidInputError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Invalid Doctor ID format: ${doctorId}`
                );
            }
            throw error;
        }
    }
    static async updateDoctor(doctorId, updates) {
        try {
            if (Object.keys(updates).length === 0) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'No update fields provided.'
                );
            }

            const updatedDoctor = await Doctor.findOneAndUpdate(
                { doctorId: doctorId },
                { $set: updates },
                {
                    new: true,
                    runValidators: true,
                    context: 'query'
                }
            ).select('-_id -__v');

            if (!updatedDoctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Doctor not found.'
                );
            }

            return updatedDoctor;
        } catch (error) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            if (error.name === 'CastError') {
                throw new EasyQError(
                    'InvalidInputError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Invalid Doctor ID format: ${doctorId}`
                );
            }
            throw error;
        }
    }

    static async deleteDoctor(doctorId) {
        try {
            const deletedDoctor = await Doctor.findOneAndDelete({ doctorId: doctorId }).select('-_id -__v');
            if (!deletedDoctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Doctor not found.'
                );
            }
            return deletedDoctor;
        } catch (error) {
            if (error.name === 'CastError') {
                throw new EasyQError(
                    'InvalidInputError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Invalid Doctor ID format: ${doctorId}`
                );
            }
            throw error;
        }
    }

    static async getDoctorsByHospital(hospitalId, options = {}) {
        try {
            const { page = 1, limit = 10, specialization } = options;
            
            const filter = { hospitalId: hospitalId };
            if (specialization) {
                filter.specialization = new RegExp(specialization, 'i');
            }

            const skip = (page - 1) * limit;
            const doctors = await Doctor.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await Doctor.countDocuments(filter);

            return {
                doctors: doctors,
                hospitalId: hospitalId,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                },
                filters: {
                    specialization: specialization || null
                }
            };
        } catch (error) {
            if (error.name === 'CastError') {
                throw new EasyQError(
                    'InvalidInputError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Invalid Hospital ID format: ${hospitalId}`
                );
            }
            throw error;
        }
    }

    static async searchDoctors(searchParams) {
        try {
            const { 
                name, 
                specialization, 
                hospitalId, 
                city, 
                minExperience, 
                maxExperience,
                page = 1, 
                limit = 10 
            } = searchParams;

            const filter = {};
            
            if (name) {
                filter.name = new RegExp(name, 'i');
            }
            
            if (specialization) {
                filter.specialization = new RegExp(specialization, 'i');
            }
            
            if (hospitalId) {
                filter.hospitalId = hospitalId;
            }
            
            if (city) {
                filter.city = new RegExp(city, 'i');
            }
            
            if (minExperience !== undefined || maxExperience !== undefined) {
                filter.experience = {};
                if (minExperience !== undefined) filter.experience.$gte = parseInt(minExperience);
                if (maxExperience !== undefined) filter.experience.$lte = parseInt(maxExperience);
            }

            const skip = (page - 1) * limit;
            const doctors = await Doctor.find(filter)
                .sort({ experience: -1, name: 1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await Doctor.countDocuments(filter);

            return {
                doctors: doctors,
                searchParams: searchParams,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Search operation failed: ${error.message}`
            );
        }
    }

    static async getDoctorStatistics(doctorId) {
        try {
            const doctor = await Doctor.findOne({ doctorId: doctorId }).select('-_id -__v');
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Doctor not found.'
                );
            }

            return {
                doctor: doctor,
                statistics: {
                    yearsOfService: this.calculateYearsOfService(doctor.serviceStartDate),
                    isActive: doctor.isActive || true,
                    lastUpdated: doctor.updatedAt
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static calculateYearsOfService(serviceStartDate) {
        if (!serviceStartDate) return 0;
        
        const start = new Date(serviceStartDate);
        const now = new Date();
        const diffInMs = now - start;
        const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
        
        return Math.floor(diffInYears);
    }

    static async validateDoctorExists(doctorId) {
        const doctor = await Doctor.findOne({ doctorId: doctorId });
        if (!doctor) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Doctor with ID ${doctorId} not found.`
            );
        }
        return doctor;
    }

    static async getDoctorsBySpecialization(specialization, options = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'experience', sortOrder = 'desc' } = options;
            
            const filter = { 
                specialization: new RegExp(specialization, 'i')
            };

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const skip = (page - 1) * limit;
            const doctors = await Doctor.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await Doctor.countDocuments(filter);

            return {
                doctors: doctors,
                specialization: specialization,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch doctors by specialization: ${error.message}`
            );
        }
    }

    static async removePatientFromDoctor(doctorId, patientId) {
        try {
            const updatedDoctor = await Doctor.findOneAndUpdate(
                { doctorId: doctorId },
                { $pull: { patientIds: patientId } }, 
                { new: true, runValidators: true }
            );

            if (!updatedDoctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Doctor with ID ${doctorId} not found.`
                );
            }
            return updatedDoctor;
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                `Failed to remove patient from doctor: ${error.message}`
            );
        }
    }
}
