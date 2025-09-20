import Nurse from '../model/nurse.js';
import Hospital from '../model/hospital.js';
import Appointment from '../model/appointment.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { uploadNurseImage as uploadNurseImageToFirebase } from '../config/fireBaseStorage.js';

export class NurseService {
    
    static async createNurse(nurseData) {
        
            // ✅ Validate required fields
            if (!nurseData.hospitalId) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Hospital ID is required to create a nurse.'
                );
            }

            if (!nurseData.name || !nurseData.email || !nurseData.mobileNumber) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Name, email, and mobile number are required fields.'
                );
            }

            // ✅ Validate email format
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(nurseData.email)) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Please provide a valid email address.'
                );
            }

            // ✅ Validate mobile number format
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(nurseData.mobileNumber)) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Please provide a valid 10-digit mobile number.'
                );
            }

            // ✅ Check if hospital exists
            const hospital = await Hospital.findOne({ hospitalId: nurseData.hospitalId });
            if (!hospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital not found with the provided ID.'
                );
            }

            // ✅ Check if nurse with same email already exists
            const existingNurse = await Nurse.findOne({ email: nurseData.email.toLowerCase() });
            if (existingNurse) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    'A nurse with this email address already exists.'
                );
            }

            // ✅ Check if nurse with same mobile number already exists
            const existingNurseMobile = await Nurse.findOne({ mobileNumber: nurseData.mobileNumber });
            if (existingNurseMobile) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    'A nurse with this mobile number already exists.'
                );
            }

            // ✅ Create nurse
            const nurse = new Nurse({
                ...nurseData,
                email: nurseData.email.toLowerCase()
            });

            const savedNurse = await nurse.save();

            return savedNurse;
    }

    static async getNurseById(nurseId) {
        try {
            const nurse = await Nurse.findOne({ nurseId })
                .select('-_id -__v')
                .lean();

            if (!nurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Nurse not found with the provided ID.'
                );
            }

            return nurse;
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to retrieve nurse information.'
            );
        }
    }

    static async updateNurse(nurseId, updates) {
        try {
            // Remove fields that shouldn't be updated directly
            const { nurseId: _, _id, __v, createdAt, ...allowedUpdates } = updates;

            // Validate email format if email is being updated
            if (allowedUpdates.email) {
                const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
                if (!emailRegex.test(allowedUpdates.email)) {
                    throw new EasyQError(
                        'ValidationError',
                        httpStatusCode.BAD_REQUEST,
                        true,
                        'Please provide a valid email address.'
                    );
                }
                allowedUpdates.email = allowedUpdates.email.toLowerCase();
            }

            // Validate mobile number format if mobile number is being updated
            if (allowedUpdates.mobileNumber) {
                const mobileRegex = /^[0-9]{10}$/;
                if (!mobileRegex.test(allowedUpdates.mobileNumber)) {
                    throw new EasyQError(
                        'ValidationError',
                        httpStatusCode.BAD_REQUEST,
                        true,
                        'Please provide a valid 10-digit mobile number.'
                    );
                }
            }

            // Check if nurse exists
            const existingNurse = await Nurse.findOne({ nurseId });
            if (!existingNurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Nurse not found with the provided ID.'
                );
            }

            // Check for email conflicts if email is being updated
            if (allowedUpdates.email && allowedUpdates.email !== existingNurse.email) {
                const emailConflict = await Nurse.findOne({ 
                    email: allowedUpdates.email,
                    nurseId: { $ne: nurseId }
                });
                if (emailConflict) {
                    throw new EasyQError(
                        'ConflictError',
                        httpStatusCode.CONFLICT,
                        true,
                        'A nurse with this email address already exists.'
                    );
                }
            }

            // Check for mobile number conflicts if mobile number is being updated
            if (allowedUpdates.mobileNumber && allowedUpdates.mobileNumber !== existingNurse.mobileNumber) {
                const mobileConflict = await Nurse.findOne({ 
                    mobileNumber: allowedUpdates.mobileNumber,
                    nurseId: { $ne: nurseId }
                });
                if (mobileConflict) {
                    throw new EasyQError(
                        'ConflictError',
                        httpStatusCode.CONFLICT,
                        true,
                        'A nurse with this mobile number already exists.'
                    );
                }
            }

            // Update nurse
            const updatedNurse = await Nurse.findOneAndUpdate(
                { nurseId },
                { ...allowedUpdates, updatedAt: new Date() },
                { new: true, runValidators: true }
            ).select('-_id -__v');

            return updatedNurse;
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to update nurse information.'
            );
        }
    }

    static async deleteNurse(nurseId) {
        try {
            const nurse = await Nurse.findOneAndDelete({ nurseId });
            
            if (!nurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Nurse not found with the provided ID.'
                );
            }

            return nurse;
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to delete nurse.'
            );
        }
    }

    static async getNursesByHospital(hospitalId, options = {}) {
        try {
            const { page = 1, limit = 10, status, search } = options;
            const skip = (page - 1) * limit;

            // Build query
            const query = { hospitalId };

            if (status) {
                query.status = status;
            }

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { mobileNumber: { $regex: search, $options: 'i' } }
                ];
            }

            const nurses = await Nurse.find(query)
                .sort({ createdAt: -1 })
                .skip(Number(skip))
                .limit(Number(limit))
                .select('-_id -__v')
                .lean();

            const total = await Nurse.countDocuments(query);

            return {
                nurses,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalNurses: total,
                    hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
                    hasPrevPage: Number(page) > 1
                }
            };
        } catch (error) {
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to retrieve nurses.'
            );
        }
    }

    static async uploadNurseImage(nurseId, file) {
        try {
            // Check if nurse exists
            const nurse = await Nurse.findOne({ nurseId });
            if (!nurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Nurse not found with the provided ID.'
                );
            }

            // Upload image to Firebase Storage
            const uploadResult = await uploadNurseImageToFirebase(file.buffer, file.originalname, file.mimetype, nurse.hospitalId, nurseId);

            // Update nurse with new image information
            const updatedNurse = await Nurse.findOneAndUpdate(
                { nurseId },
                {
                    profileImageUrl: uploadResult.url,
                    profileImage: {
                        fileName: uploadResult.path.split('/').pop(),
                        fileUrl: uploadResult.url,
                        uploadedAt: new Date()
                    },
                    updatedAt: new Date()
                },
                { new: true, runValidators: true }
            ).select('-_id -__v');

            return {
                nurseId: updatedNurse.nurseId,
                profileImageUrl: updatedNurse.profileImageUrl,
                profileImage: updatedNurse.profileImage
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to upload nurse image.'
            );
        }
    }

    static async updateNurseImageUrl(adminId, nurseId, fileUrl, fileName) {
        try {
            // Check if nurse exists
            const nurse = await Nurse.findOne({ nurseId });
            if (!nurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Nurse not found with the provided ID.'
                );
            }

            // Update nurse with new image information
            const updatedNurse = await Nurse.findOneAndUpdate(
                { nurseId },
                {
                    profileImageUrl: fileUrl,
                    profileImage: {
                        fileName: fileName,
                        fileUrl: fileUrl,
                        uploadedAt: new Date()
                    },
                    updatedAt: new Date()
                },
                { new: true, runValidators: true }
            ).select('-_id -__v');

            return {
                nurseId: updatedNurse.nurseId,
                profileImageUrl: updatedNurse.profileImageUrl,
                profileImage: updatedNurse.profileImage
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to update nurse image URL.'
            );
        }
    }
}
