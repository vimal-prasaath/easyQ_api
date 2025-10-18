
import Doctor from '../model/doctor.js';
import Hospital from '../model/hospital.js';
import Appointment from '../model/appointment.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { uploadDoctorImage } from '../config/fireBaseStorage.js';
import AdminProfile from '../model/adminProfile.js'; // Added import for AdminProfile
import { processSpecialization, createSpecializationFilter, validateSpecialization } from '../util/specializationProcessor.js';

// Helper functions for hospital department management
const removeDoctorFromDepartments = async (hospitalId, doctorId, specializations) => {
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) return;

    for (const specialization of specializations) {
        const department = hospital.departments.find(
            dep => dep.name.toLowerCase() === specialization.toLowerCase()
        );
        
        if (department && department.doctorIds) {
            // Remove doctor from department
            department.doctorIds = department.doctorIds.filter(id => id !== doctorId);
            
            // Update doctor count
            if (typeof department.total_number_Doctor === 'string') {
                department.total_number_Doctor = Math.max(0, parseInt(department.total_number_Doctor || '0', 10) - 1).toString();
            } else {
                department.total_number_Doctor = Math.max(0, (department.total_number_Doctor || 0) - 1);
            }
            
            // Clear head of department if this doctor was the head
            if (department.departmentHeadDoctorId === doctorId) {
                department.headOfDepartment = '';
                department.departmentHeadDoctorId = '';
            }
        }
    }
    
    await hospital.save();
};

const addDoctorToDepartments = async (hospitalId, doctorId, specializations, shouldBeHead = false) => {
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) return;

    for (let i = 0; i < specializations.length; i++) {
        const specialization = specializations[i];
        const isFirstSpecialization = i === 0;
        
        let department = hospital.departments.find(
            dep => dep.name.toLowerCase() === specialization.toLowerCase()
        );
        
        if (department) {
            // Department exists, add doctor to it
            if (!department.doctorIds) {
                department.doctorIds = [];
            }
            
            if (!department.doctorIds.some(id => id === doctorId)) {
                department.doctorIds.push(doctorId);
                
                if (typeof department.total_number_Doctor === 'string') {
                    department.total_number_Doctor = (parseInt(department.total_number_Doctor || '0', 10) + 1).toString();
                } else {
                    department.total_number_Doctor = (department.total_number_Doctor || 0) + 1;
                }
            }
            
            // Set as head if specified (only for the first specialization if multiple)
            if (shouldBeHead && isFirstSpecialization && !department.departmentHeadDoctorId) {
                const doctor = await Doctor.findOne({ doctorId });
                if (doctor) {
                    department.headOfDepartment = doctor.name;
                    department.departmentHeadDoctorId = doctor.doctorId;
                }
            }
        } else {
            // Create new department
            const doctor = await Doctor.findOne({ doctorId });
            hospital.departments.push({
                name: specialization,
                doctorIds: [doctorId],
                total_number_Doctor: '1',
                headOfDepartment: shouldBeHead && isFirstSpecialization ? (doctor?.name || '') : '',
                departmentHeadDoctorId: shouldBeHead && isFirstSpecialization ? doctorId : '',
                contactNumber: '',
                description: '',
            });
        }
    }
    
    await hospital.save();
};

const cleanupEmptyDepartments = async (hospitalId) => {
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) return;

    // Remove departments with no doctors
    hospital.departments = hospital.departments.filter(
        dept => dept.doctorIds && dept.doctorIds.length > 0
    );
    
    await hospital.save();
};

export class DoctorService {
    
    static async createDoctor(doctorData) {
        try {
            // ✅ Validate required fields
            if (!doctorData.hospitalId) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Hospital ID is required to create a doctor.'
                );
            }

            if (!doctorData.name || !doctorData.email || !doctorData.mobileNumber) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Name, email, and mobile number are required fields.'
                );
            }

            // ✅ Validate email format
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(doctorData.email)) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Please provide a valid email address.'
                );
            }

            // ✅ Validate mobile number format
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(doctorData.mobileNumber)) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Please provide a valid 10-digit mobile number.'
                );
            }

            // ✅ Process specialization
            if (doctorData.specialization) {
                const validation = validateSpecialization(doctorData.specialization);
                if (!validation.isValid) {
                    throw new EasyQError(
                        'ValidationError',
                        httpStatusCode.BAD_REQUEST,
                        true,
                        `Invalid departments: ${validation.invalidDepartments.join(', ')}. Valid departments are: General Medicine, General Checkup, Pediatrics, Gynecology, Cardiology, Dermatology, Dental, Diabetology, Eye Care, Orthopedics, Gastroenterology, Pulmonology, Neurology, Urology, Physiotherapy, Emergency Care`
                    );
                }
                doctorData.specialization = validation.processed;
            }

            // ✅ Check if doctor with same email already exists
            const existingDoctorByEmail = await Doctor.findOne({ email: doctorData.email.toLowerCase() });
            if (existingDoctorByEmail) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    `A doctor with email ${doctorData.email} already exists.`
                );
            }

            // ✅ Check if doctor with same mobile already exists
            const existingDoctorByMobile = await Doctor.findOne({ mobileNumber: doctorData.mobileNumber });
            if (existingDoctorByMobile) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    `A doctor with mobile number ${doctorData.mobileNumber} already exists.`
                );
            }

            // ✅ Validate permissions if provided
            if (doctorData.permissions) {
                const validPermissions = [
                    'profile', 'tokenIssued', 'checkedIn', 'userLogs', 'documentsView',
                    'doctorsList', 'addDoctor', 'editDoctor', 'deleteDoctor', 'todayLogs',
                    'scanQr', 'uploadDocs'
                ];
                
                for (const [permissionKey, permissionValue] of Object.entries(doctorData.permissions)) {
                    if (!validPermissions.includes(permissionKey)) {
                        throw new EasyQError(
                            'ValidationError',
                            httpStatusCode.BAD_REQUEST,
                            true,
                            `Invalid permission: ${permissionKey}. Valid permissions are: ${validPermissions.join(', ')}`
                        );
                    }
                    
                    if (permissionValue && typeof permissionValue === 'object') {
                        if (permissionValue.enabled !== undefined && typeof permissionValue.enabled !== 'boolean') {
                            throw new EasyQError(
                                'ValidationError',
                                httpStatusCode.BAD_REQUEST,
                                true,
                                `Permission ${permissionKey}.enabled must be a boolean value`
                            );
                        }
                        if (permissionValue.viewOnly !== undefined && typeof permissionValue.viewOnly !== 'boolean') {
                            throw new EasyQError(
                                'ValidationError',
                                httpStatusCode.BAD_REQUEST,
                                true,
                                `Permission ${permissionKey}.viewOnly must be a boolean value`
                            );
                        }
                    } else {
                        throw new EasyQError(
                            'ValidationError',
                            httpStatusCode.BAD_REQUEST,
                            true,
                            `Permission ${permissionKey} must be an object with enabled and viewOnly properties`
                        );
                    }
                }
            }

            // ✅ Validate hospital exists and is active
            const hospitalData = await Hospital.findOne({ hospitalId: doctorData.hospitalId });
            if (!hospitalData) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Hospital with ID ${doctorData.hospitalId} not found. Cannot create doctor.`
                );
            }
            if (hospitalData.isActive === false) {
                throw new EasyQError(
                    'HospitalInactiveError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Cannot add doctor. Hospital with ID ${doctorData.hospitalId} is inactive.`
                );
            }

            const doctor = await Doctor.create(doctorData);
            const shouldBeHead = doctorData.isHeadOfDepartment === true;

            // ✅ Create separate departments for each specialization using helper function
            const specializations = doctor.specialization.split(',').map(s => s.trim());
            await addDoctorToDepartments(doctorData.hospitalId, doctor.doctorId, specializations, shouldBeHead);
           
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
        // ✅ Validate doctorId
        if (!doctorId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required for update.'
            );
        }

        if (!updates || Object.keys(updates).length === 0) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'No update fields provided.'
            );
        }

        // ✅ Process specialization if provided
        if (updates.specialization) {
            const validation = validateSpecialization(updates.specialization);
            if (!validation.isValid) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Invalid departments: ${validation.invalidDepartments.join(', ')}. Valid departments are: General Medicine, General Checkup, Pediatrics, Gynecology, Cardiology, Dermatology, Dental, Diabetology, Eye Care, Orthopedics, Gastroenterology, Pulmonology, Neurology, Urology, Physiotherapy, Emergency Care`
                );
            }
            updates.specialization = validation.processed;
        }

        // ✅ Check if doctor exists
        const doctor = await Doctor.findOne({ doctorId });

        if (!doctor) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Doctor with ID ${doctorId} not found.`
            );
        }

        // ✅ Validate email format if being updated
        if (updates.email) {
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(updates.email)) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Please provide a valid email address.'
                );
            }

            // ✅ Check if email is already taken by another doctor
            const existingDoctorByEmail = await Doctor.findOne({ 
                email: updates.email.toLowerCase(),
                doctorId: { $ne: doctorId } // Exclude current doctor
            });
            if (existingDoctorByEmail) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    `A doctor with email ${updates.email} already exists.`
                );
            }
        }

        // ✅ Validate mobile number format if being updated
        if (updates.mobileNumber) {
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(updates.mobileNumber)) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Please provide a valid 10-digit mobile number.'
                );
            }

            // ✅ Check if mobile is already taken by another doctor
            const existingDoctorByMobile = await Doctor.findOne({ 
                mobileNumber: updates.mobileNumber,
                doctorId: { $ne: doctorId } // Exclude current doctor
            });
            if (existingDoctorByMobile) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    `A doctor with mobile number ${updates.mobileNumber} already exists.`
                );
            }
        }

        // ✅ Validate permissions if being updated
        if (updates.permissions) {
            const validPermissions = [
                'profile', 'tokenIssued', 'checkedIn', 'userLogs', 'documentsView',
                'doctorsList', 'addDoctor', 'editDoctor', 'deleteDoctor', 'todayLogs',
                'scanQr', 'uploadDocs'
            ];
            
            for (const [permissionKey, permissionValue] of Object.entries(updates.permissions)) {
                if (!validPermissions.includes(permissionKey)) {
                    throw new EasyQError(
                        'ValidationError',
                        httpStatusCode.BAD_REQUEST,
                        true,
                        `Invalid permission: ${permissionKey}. Valid permissions are: ${validPermissions.join(', ')}`
                    );
                }
                
                if (permissionValue && typeof permissionValue === 'object') {
                    if (permissionValue.enabled !== undefined && typeof permissionValue.enabled !== 'boolean') {
                        throw new EasyQError(
                            'ValidationError',
                            httpStatusCode.BAD_REQUEST,
                            true,
                            `Permission ${permissionKey}.enabled must be a boolean value`
                        );
                    }
                    if (permissionValue.viewOnly !== undefined && typeof permissionValue.viewOnly !== 'boolean') {
                        throw new EasyQError(
                            'ValidationError',
                            httpStatusCode.BAD_REQUEST,
                            true,
                            `Permission ${permissionKey}.viewOnly must be a boolean value`
                        );
                    }
                } else {
                    throw new EasyQError(
                        'ValidationError',
                        httpStatusCode.BAD_REQUEST,
                        true,
                        `Permission ${permissionKey} must be an object with enabled and viewOnly properties`
                    );
                }
            }
        }

        // ✅ Validate hospital exists if hospitalId is being updated
        if (updates.hospitalId && updates.hospitalId !== doctor.hospitalId) {
            const hospitalData = await Hospital.findOne({ hospitalId: updates.hospitalId });
            if (!hospitalData) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Hospital with ID ${updates.hospitalId} not found. Cannot update doctor.`
                );
            }
            if (hospitalData.isActive === false) {
                throw new EasyQError(
                    'HospitalInactiveError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Cannot update doctor. Hospital with ID ${updates.hospitalId} is inactive.`
                );
            }
        }

        // ✅ Validate workingHours if provided
        if (updates.workingHours !== undefined && updates.workingHours !== null && !Array.isArray(updates.workingHours)) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'workingHours must be an array or null.'
            );
        }

        // ✅ Handle profile image updates to ensure profileImageUrl is also updated
        if (updates.profileImage && updates.profileImage.fileUrl) {
            updates.profileImageUrl = updates.profileImage.fileUrl;
        }

        // ✅ Handle hospital department sync if specialization is being updated
        if (updates.specialization) {
            const oldSpecializations = doctor.specialization.split(',').map(s => s.trim());
            const newSpecializations = updates.specialization.split(',').map(s => s.trim());
            
            // Remove doctor from old departments
            await removeDoctorFromDepartments(doctor.hospitalId, doctorId, oldSpecializations);
            
            // Clean up empty departments
            await cleanupEmptyDepartments(doctor.hospitalId);
        }

        // ✅ Apply all other general updates like name, email, status, etc.
        Object.assign(doctor, updates);

        // ✅ Update the doctor in database (workingHours already handled separately)
        await Doctor.findOneAndUpdate({ doctorId }, updates, { new: true });

        // ✅ Add doctor to new departments if specialization was updated
        if (updates.specialization) {
            const newSpecializations = updates.specialization.split(',').map(s => s.trim());
            const shouldBeHead = updates.isHeadOfDepartment === true;
            await addDoctorToDepartments(doctor.hospitalId, doctorId, newSpecializations, shouldBeHead);
        }

        // Return cleaned object
        return doctor.toObject({
            versionKey: false,
            transform: (_, ret) => {
                delete ret._id;
                return ret;
            }
        });

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
            // ✅ Get doctor info before deletion for hospital department cleanup
            const doctor = await Doctor.findOne({ doctorId });
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Doctor not found.'
                );
            }

            // ✅ Remove doctor from hospital departments before deletion
            const specializations = doctor.specialization.split(',').map(s => s.trim());
            await removeDoctorFromDepartments(doctor.hospitalId, doctorId, specializations);
            
            // ✅ Clean up empty departments
            await cleanupEmptyDepartments(doctor.hospitalId);

            // ✅ Delete the doctor
            const deletedDoctor = await Doctor.findOneAndDelete({ doctorId: doctorId }).select('-_id -__v');
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
            // ✅ Validate hospitalId
            if (!hospitalId) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Hospital ID is required to get doctors.'
                );
            }

            // ✅ Validate hospital exists
            const hospitalData = await Hospital.findOne({ hospitalId: hospitalId });
            if (!hospitalData) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Hospital with ID ${hospitalId} not found.`
                );
            }

            const { page = 1, limit = 10, specialization } = options;
            
            // ✅ Validate pagination parameters
            if (page < 1 || limit < 1) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Page and limit must be positive numbers.'
                );
            }

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
                hospitalName: hospitalData.name, // ✅ Include hospital name
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

 static async meetDoctor(hospitalId, date, options = {}) {
    try {
        const { page = 1, limit = 10, specialization } = options;
        const skip = (page - 1) * limit;

        // Validate date format MM/DD/YYYY
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[1-2][0-9]|3[0-1])\/\d{4}$/;
        if (!dateRegex.test(date)) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Date must be in MM/DD/YYYY format.'
            );
        }

        const [month, day, year] = date.split('/');
        const targetDate = new Date(`${year}-${month}-${day}`);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        // Build doctor query filter
        const doctorQuery = {
            hospitalId,
            workingHours: {
                $elemMatch: {
                    date: { $gte: startOfDay, $lte: endOfDay }
                }
            }
        };

        if (specialization) {
            doctorQuery.specialization = new RegExp(specialization, 'i');
        }

        const doctors = await Doctor.find(doctorQuery)
            .sort({ createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit))
            .select('-_id -__v')
            .lean(); // to allow workingHours manipulation below

        // Filter each doctor’s workingHours array to only include entries for the target date
        const filteredDoctors = doctors.map((doctor) => {
            const filteredWorkingHours = doctor.workingHours.filter(wh => {
                const whDate = new Date(wh.date);
                return whDate >= startOfDay && whDate <= endOfDay;
            });

            return {
                ...doctor,
                workingHours: filteredWorkingHours
            };
        });

        return filteredDoctors;
    } catch (error) {
        throw new EasyQError(
            error.name || 'ServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            error.message || 'Failed to fetch doctors'
        );
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
            
            // Use enhanced search filter for better partial matching
            const filter = createSpecializationFilter(specialization);

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

    static async uploadDoctorImage(doctorId, file) {
        try {
            // ✅ Validate doctorId
            if (!doctorId) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Doctor ID is required to upload image.'
                );
            }

            // ✅ Validate file
            if (!file) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'No file provided for upload.'
                );
            }

            // ✅ Validate file type
            // const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            // if (!allowedMimeTypes.includes(file.mimetype)) {
            //     throw new EasyQError(
            //         'ValidationError',
            //         httpStatusCode.BAD_REQUEST,
            //         true,
            //         'Only JPEG, JPG, and PNG image files are allowed.'
            //     );
            // }

            // ✅ Validate file size (5MB limit)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'File size must be less than 5MB.'
                );
            }

            // ✅ Check if doctor exists
            const doctor = await Doctor.findOne({ doctorId: doctorId });
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Doctor with ID ${doctorId} not found.`
                );
            }

            // ✅ Validate hospital exists
            const hospitalData = await Hospital.findOne({ hospitalId: doctor.hospitalId });
            if (!hospitalData) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Hospital with ID ${doctor.hospitalId} not found for doctor ${doctorId}.`
                );
            }

            // Upload image to Firebase
            const uploadResult = await uploadDoctorImage(
                file.buffer,
                file.originalname,
                file.mimetype,
                doctor.hospitalId,
                doctorId
            );

            // Update doctor profile with new image
            const updatedDoctor = await Doctor.findOneAndUpdate(
                { doctorId: doctorId },
                {
                    profileImage: {
                        fileName: uploadResult.path.split('/').pop(),
                        fileUrl: uploadResult.url,
                        uploadedAt: new Date()
                    },
                    // Also update the profileImageUrl field with the uploaded image URL
                    profileImageUrl: uploadResult.url
                },
                { new: true, runValidators: true }
            );

            return {
                message: "Doctor image uploaded successfully",
                profileImageUrl: updatedDoctor.profileImageUrl
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                `Failed to upload doctor image: ${error.message}`
            );
        }
    }

    // New method for updating doctor profile image URL (frontend handles upload)
    static async updateDoctorImageUrl(adminId, doctorId, fileUrl, fileName) {
        try {
            // Verify admin exists and is approved
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Admin not found.'
                );
            }

            if (admin.verificationStatus !== 'Approved') {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.FORBIDDEN,
                    true,
                    'Only approved admins can update doctor information.'
                );
            }

            // Find and update doctor
            const updatedDoctor = await Doctor.findOneAndUpdate(
                { doctorId },
                {
                    $set: {
                        profileImage: {
                            fileName: fileName,
                            fileUrl: fileUrl,
                            uploadedAt: new Date()
                        },
                        // Also update the profileImageUrl field with the provided image URL
                        profileImageUrl: fileUrl
                    }
                },
                { new: true }
            );


            if (!updatedDoctor) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Doctor not found or not associated with this admin.'
                );
            }

            return {
                doctorId: updatedDoctor.doctorId,
                name: updatedDoctor.name,
                profileImage: updatedDoctor.profileImage
            };
        } catch (error) {
            throw error;
        }
    }

    static async getAvailableTimeSlots(doctorId, date) {
        try {
            // ✅ Validate inputs
            if (!doctorId) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Doctor ID is required.'
                );
            }

            if (!date) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Date is required.'
                );
            }

            // ✅ Get doctor with working hours
            const doctor = await Doctor.findOne({ doctorId }).select('name maxAppointment unlimitedToken workingHours');
            
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Doctor with ID ${doctorId} not found.`
                );
            }

            // ✅ Parse and validate date
            let parsedDate;
            try {
                // Support multiple date formats
                if (date.includes('/')) {
                    // MM/DD/YYYY format
                    const [month, day, year] = date.split('/');
                    parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                } else {
                    // ISO format or YYYY-MM-DD
                    parsedDate = new Date(date);
                }
                
                if (isNaN(parsedDate.getTime())) {
                    throw new Error('Invalid date');
                }
            } catch (error) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Invalid date format. Please use YYYY-MM-DD or MM/DD/YYYY format.'
                );
            }

            // ✅ Get day of week
            const dayOfWeek = parsedDate.toLocaleDateString('en-US', { weekday: 'long' });
            
            // ✅ Find working hours for the day
            const dayWorkingHours = doctor.workingHours.find(wh => wh.day === dayOfWeek);
            
            if (!dayWorkingHours || !dayWorkingHours.timeSlots || dayWorkingHours.timeSlots.length === 0) {
                return {
                    doctorId: doctor.doctorId,
                    doctorName: doctor.name,
                    date: date,
                    day: dayOfWeek,
                    maxAppointment: doctor.maxAppointment,
                    unlimitedToken: doctor.unlimitedToken,
                    availableTimeSlots: [],
                    message: `No working hours found for ${dayOfWeek}.`
                };
            }

            // ✅ Generate time slots from working hours
            const availableTimeSlots = [];
            
            for (const timeSlot of dayWorkingHours.timeSlots) {
                const slots = this.generateTimeSlots(timeSlot.startTime, timeSlot.endTime);
                
                for (const slot of slots) {
                    // ✅ Count appointments for this specific time slot
                    const startOfDay = new Date(parsedDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    
                    const endOfDay = new Date(parsedDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    
                    const appointmentCount = await Appointment.countDocuments({
                        doctorId: doctorId,
                        appointmentDate: { $gte: startOfDay, $lte: endOfDay },
                        appointmentTime: slot.startTime
                    });

                    // ✅ Calculate slot limit (proportional for partial slots)
                    const slotDuration = this.getTimeDifferenceInMinutes(slot.startTime, slot.endTime);
                    const standardDuration = 120; // 2 hours
                    const maxTokens = doctor.unlimitedToken ? 
                        Infinity : 
                        Math.max(1, Math.floor((slotDuration / standardDuration) * parseInt(doctor.maxAppointment)));

                    // ✅ Check availability
                    const isAvailable = doctor.unlimitedToken || appointmentCount < maxTokens;
                    const remainingSlots = doctor.unlimitedToken ? 
                        Infinity : 
                        Math.max(0, maxTokens - appointmentCount);

                    availableTimeSlots.push({
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        duration: slotDuration,
                        maxTokens: doctor.unlimitedToken ? 'unlimited' : maxTokens,
                        bookedAppointments: appointmentCount,
                        remainingSlots: doctor.unlimitedToken ? 'unlimited' : remainingSlots,
                        isAvailable: isAvailable
                    });
                }
            }

            return {
                doctorId: doctor.doctorId,
                doctorName: doctor.name,
                date: date,
                day: dayOfWeek,
                maxAppointment: doctor.maxAppointment,
                unlimitedToken: doctor.unlimitedToken,
                availableTimeSlots: availableTimeSlots
            };

        } catch (error) {
            if (error.name === 'ValidationError' || error.name === 'NotFoundError') {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to get available time slots: ${error.message}`
            );
        }
    }

    // ✅ Helper method to generate time slots
    static generateTimeSlots(startTime, endTime, slotDuration = 120) {
        const slots = [];
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        
        let currentMinutes = startMinutes;
        
        while (currentMinutes < endMinutes) {
            const nextMinutes = Math.min(currentMinutes + slotDuration, endMinutes);
            slots.push({
                startTime: this.minutesToTime(currentMinutes),
                endTime: this.minutesToTime(nextMinutes)
            });
            currentMinutes = nextMinutes;
        }
        
        return slots;
    }

    // ✅ Helper method to convert time to minutes
    static timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // ✅ Helper method to convert minutes to time
    static minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    // ✅ Helper method to get time difference in minutes
    static getTimeDifferenceInMinutes(startTime, endTime) {
        return this.timeToMinutes(endTime) - this.timeToMinutes(startTime);
    }

}
