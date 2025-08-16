import AdminProfile from "../model/adminProfile.js";
import Hospital from "../model/hospital.js";
import Doctor from "../model/doctor.js";
import Appointment from "../model/appointment.js";
import HospitalReview from "../model/hospitalReview.js";
import HospitalDetails from "../model/facility.js";
import Favourite from "../model/hospitalFavourite.js";
import bcrypt from "bcrypt";
import { generateToken } from "../util/tokenGenerator.js";
import { EasyQError } from "../config/error.js";
import { httpStatusCode } from "../util/statusCode.js";
import { authLogger } from "../config/logger.js";
import { uploadAdminHospitalFile, uploadAdminOwnerFile, deleteFolderFromFirebase, extractFilePathFromUrl, deleteFileFromFirebase } from "../config/fireBaseStorage.js";
import User from "../model/userProfile.js"; // Added import for User model

class AdminService {
    async createAdmin(adminData) {
        try {
            // Check if admin with email already exists
            const existingAdmin = await AdminProfile.findOne({ email: adminData.email });
            if (existingAdmin) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Admin with this email already exists.'
                );
            }

            // Check if admin with username already exists
            const existingUsername = await AdminProfile.findOne({ username: adminData.username });
            if (existingUsername) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Admin with this username already exists.'
                );
            }

            // Create admin - password will be hashed by model pre-save hook
            const admin = new AdminProfile(adminData);
            await admin.save();

            // Generate JWT token automatically after signup
            const tokenData = {
                userId: admin.adminId,
                email: admin.email,
                username: admin.username,
                role: 'admin'
            };
            const token = generateToken(tokenData);

            return {
                message: "Admin account created successfully",
                admin: {
                    adminId: admin.adminId,
                    email: admin.email,
                    username: admin.username,
                    verificationStatus: admin.verificationStatus,
                    isActive: admin.isActive,
                    onboardingProgress: admin.getOnboardingProgress()
                },
                token: token // Token is now returned here
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            authLogger.error('Error creating admin:', error);
            throw new EasyQError(
                error,
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to create admin account.'
            );
        }
    }

    async loginAdmin(loginData) {
        try {
            // Find admin by email
            const admin = await AdminProfile.findOne({ email: loginData.email });
            if (!admin) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Invalid email'
                );
            }

            // Check if admin is active
            if (!admin.isActive) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Admin account is not active. Please contact administrator.'
                );
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(loginData.password, admin.password);
            if (!isPasswordValid) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Invalid password.' + loginData.password + admin.password
                );
            }

            // Generate JWT token
            const tokenData = {
                userId: admin.adminId,
                email: admin.email,
                username: admin.username,
                role: 'admin'
            };
            const token = generateToken(tokenData);

            return {
                message: "Admin authenticated successfully",
                admin: {
                    adminId: admin.adminId,
                    email: admin.email,
                    username: admin.username,
                    verificationStatus: admin.verificationStatus,
                    isActive: admin.isActive,
                    onboardingProgress: admin.getOnboardingProgress()
                },
                token: token
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            authLogger.error('Error during admin login:', error);
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to authenticate admin.'
            );
        }
    }

    async updateOnboardingInfo(adminId, onboardingData) {
        try {
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Admin not found.'
                );
            }

            // Create or update hospital with all information
            let hospital = await Hospital.findOne({ adminId });
            
            if (!hospital) {
                // Create new hospital
                hospital = new Hospital({
                    adminId: adminId,
                    name: onboardingData.hospitalName,
                    hospitalType: onboardingData.hospitalType,
                    registrationNumber: onboardingData.registrationNumber,
                    yearEstablished: onboardingData.yearEstablished,
                    address: {
                        street: onboardingData.address,
                        city: onboardingData.city,
                        state: onboardingData.state,
                        zipCode: onboardingData.pincode,
                        country: "India"
                    },
                    location: {
                        type: "Point",
                        coordinates: [0, 0] // Default coordinates - can be updated later
                    },
                    googleMapLink: onboardingData.googleMapLink,
                    phoneNumber: onboardingData.phoneNumber,
                    alternativePhone: onboardingData.alternativePhone,
                    emailAddress: onboardingData.emailAddress,
                    workingDays: onboardingData.workingDays,
                    startTime: onboardingData.startTime,
                    endTime: onboardingData.endTime,
                    openAlways: onboardingData.openAlways,
                    maxTokenPerDay: onboardingData.maxTokenPerDay,
                    unlimitedToken: onboardingData.unlimitedToken
                });
            } else {
                // Update existing hospital
                hospital.name = onboardingData.hospitalName;
                hospital.hospitalType = onboardingData.hospitalType;
                hospital.registrationNumber = onboardingData.registrationNumber;
                hospital.yearEstablished = onboardingData.yearEstablished;
                hospital.address = {
                    street: onboardingData.address,
                    city: onboardingData.city,
                    state: onboardingData.state,
                    zipCode: onboardingData.pincode,
                    country: "India"
                };
                // Ensure location field exists for geospatial index
                if (!hospital.location || !hospital.location.coordinates) {
                    hospital.location = {
                        type: "Point",
                        coordinates: [0, 0] // Default coordinates - can be updated later
                    };
                }
                hospital.googleMapLink = onboardingData.googleMapLink;
                hospital.phoneNumber = onboardingData.phoneNumber;
                hospital.alternativePhone = onboardingData.alternativePhone;
                hospital.emailAddress = onboardingData.emailAddress;
                hospital.workingDays = onboardingData.workingDays;
                hospital.startTime = onboardingData.startTime;
                hospital.endTime = onboardingData.endTime;
                hospital.openAlways = onboardingData.openAlways;
                hospital.maxTokenPerDay = onboardingData.maxTokenPerDay;
                hospital.unlimitedToken = onboardingData.unlimitedToken;
            }
            await hospital.save();

            // Update admin with owner info, hospital reference, and progress
            admin.ownerInfo = {
                name: onboardingData.ownerName,
                mobile: onboardingData.ownerMobile,
                proof: onboardingData.ownerProof,
                proofNumber: onboardingData.ownerProofNumber
            };
            
            // Set the hospital reference in admin
            admin.hospitalId = hospital._id;

            // Mark all steps as completed
            admin.ownerInfoCollected = true;
            admin.basicInfoCollected = true;
            admin.addressInfoCollected = true;
            admin.contactDetailsCollected = true;
            admin.documentsCollected = true;
            admin.operationDetailsCollected = true;

            await admin.save();

            return {
                message: "Onboarding information updated successfully",
                hospital: {
                    hospitalId: hospital.hospitalId,
                    hospitalMongoId: hospital._id,
                    name: hospital.name,
                    hospitalType: hospital.hospitalType,
                    registrationNumber: hospital.registrationNumber,
                    yearEstablished: hospital.yearEstablished,
                    address: hospital.address,
                    contact: {
                        phoneNumber: hospital.phoneNumber,
                        alternativePhone: hospital.alternativePhone,
                        emailAddress: hospital.emailAddress
                    },
                    operation: {
                        workingDays: hospital.workingDays,
                        startTime: hospital.startTime,
                        endTime: hospital.endTime,
                        openAlways: hospital.openAlways,
                        maxTokenPerDay: hospital.maxTokenPerDay,
                        unlimitedToken: hospital.unlimitedToken
                    }
                },
                ownerInfo: admin.ownerInfo,
                onboardingProgress: admin.getOnboardingProgress()
            };
        } catch (error) {
            console.log("error", error);
            if (error instanceof EasyQError) {
                throw error;
            }
            authLogger.error('Error updating onboarding info:', error);
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to update onboarding information.'
            );
        }
    }

    async updateHospitalDocuments(adminId, file, documentType) {
        try {
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Admin not found'
                );
            }

            if (!admin.hospitalId) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Hospital not found for this admin. Please complete onboarding first.'
                );
            }

            const hospital = await Hospital.findById(admin.hospitalId);
            if (!hospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital not found'
                );
            }

            // Upload file to Firebase using hospital's hospitalId (not admin's hospitalId)
            const fileStorageInfo = await uploadAdminHospitalFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                hospital.hospitalId,
                documentType
            );

            // Update hospital documents
            const documentData = {
                fileName: file.originalname,
                fileUrl: fileStorageInfo.url,
                fileKey: fileStorageInfo.path,
                uploadedAt: new Date()
            };

            // Update the specific document type in hospital.documents
            hospital.documents[documentType] = documentData;
            await hospital.save();

            return {
                message: 'Hospital document uploaded successfully',
                document: {
                    fileName: documentData.fileName,
                    fileUrl: documentData.fileUrl,
                    uploadedAt: documentData.uploadedAt
                }
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to upload hospital document: ${error.message}`
            );
        }
    }

    async updateOwnerDocuments(adminId, file, documentType) {
        try {
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Admin not found'
                );
            }

            // Upload file to Firebase
            const fileStorageInfo = await uploadAdminOwnerFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                adminId,
                documentType
            );

            // Update admin owner documents
            const documentData = {
                fileName: file.originalname,
                fileUrl: fileStorageInfo.url,
                fileKey: fileStorageInfo.path,
                uploadedAt: new Date()
            };

            // Update the specific document type in admin.ownerDocuments
            admin.ownerDocuments[documentType] = documentData;
            await admin.save();

            return {
                message: 'Owner document uploaded successfully',
                document: {
                    fileName: documentData.fileName,
                    fileUrl: documentData.fileUrl,
                    uploadedAt: documentData.uploadedAt
                }
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to upload owner document: ${error.message}`
            );
        }
    }

    async getAdminById(adminId) {
        try {
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Admin not found.'
                );
            }

            return {
                admin: {
                    adminId: admin.adminId,
                    email: admin.email,
                    username: admin.username,
                    ownerInfo: admin.ownerInfo,
                    ownerDocuments: admin.ownerDocuments,
                    verificationStatus: admin.verificationStatus,
                    isActive: admin.isActive,
                    onboardingProgress: admin.getOnboardingProgress()
                }
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            authLogger.error('Error getting admin details:', error);
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to get admin details.'
            );
        }
    }

    async getAdminDashboard(adminId) {
        try {
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Admin not found.'
                );
            }

            // Get hospital details if exists
            let hospital = null;
            if (admin.hospitalId) {
                hospital = await Hospital.findById(admin.hospitalId);
            }

            // Get basic statistics (placeholder for now)
            const dashboardStats = {
                totalDoctors: 0,
                totalAppointments: 0,
                totalPatients: 0,
                todayAppointments: 0,
                pendingVerifications: 0
            };

            return {
                admin: {
                    adminId: admin.adminId,
                    email: admin.email,
                    username: admin.username,
                    ownerInfo: admin.ownerInfo,
                    ownerDocuments: admin.ownerDocuments,
                    verificationStatus: admin.verificationStatus,
                    isActive: admin.isActive,
                    onboardingProgress: admin.getOnboardingProgress(),
                    createdAt: admin.createdAt,
                    updatedAt: admin.updatedAt
                },
                hospital: hospital ? {
                    hospitalId: hospital.hospitalId,
                    hospitalMongoId: hospital._id,
                    name: hospital.name,
                    hospitalType: hospital.hospitalType,
                    registrationNumber: hospital.registrationNumber,
                    yearEstablished: hospital.yearEstablished,
                    address: hospital.address,
                    location: hospital.location,
                    googleMapLink: hospital.googleMapLink,
                    contact: {
                        phoneNumber: hospital.phoneNumber,
                        alternativePhone: hospital.alternativePhone,
                        emailAddress: hospital.emailAddress
                    },
                    operation: {
                        workingDays: hospital.workingDays,
                        startTime: hospital.startTime,
                        endTime: hospital.endTime,
                        openAlways: hospital.openAlways,
                        maxTokenPerDay: hospital.maxTokenPerDay,
                        unlimitedToken: hospital.unlimitedToken
                    },
                    documents: hospital.documents,
                    isActive: hospital.isActive,
                    createdAt: hospital.createdAt,
                    updatedAt: hospital.updatedAt
                } : null,
                statistics: dashboardStats,
                lastUpdated: new Date()
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            authLogger.error('Error getting admin dashboard:', error);
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to get admin dashboard data.'
            );
        }
    }

    async updateOwnerInfo(adminId, ownerData) {
        try {
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Admin not found.'
                );
            }

            // Update owner information
            admin.ownerInfo = {
                name: ownerData.name,
                mobile: ownerData.mobile,
                proof: ownerData.proof,
                proofNumber: ownerData.proofNumber
            };

            // Mark owner info as collected
            admin.ownerInfoCollected = true;

            await admin.save();

            return {
                message: "Owner information updated successfully",
                ownerInfo: admin.ownerInfo,
                onboardingProgress: admin.getOnboardingProgress(),
                updatedAt: admin.updatedAt
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            authLogger.error('Error updating owner info:', error);
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to update owner information.'
            );
        }
    }

    async updateHospitalBasicInfo(adminId, hospitalData) {
        try {
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Admin not found.'
                );
            }

            if (!admin.hospitalId) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Hospital not found for this admin. Please complete onboarding first.'
                );
            }

            const hospital = await Hospital.findById(admin.hospitalId);
            if (!hospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital not found.'
                );
            }

            // Update basic hospital information
            hospital.name = hospitalData.name;
            hospital.hospitalType = hospitalData.hospitalType;
            hospital.registrationNumber = hospitalData.registrationNumber;
            hospital.yearEstablished = hospitalData.yearEstablished;
            hospital.googleMapLink = hospitalData.googleMapLink;

            await hospital.save();

            // Mark basic info as collected
            admin.basicInfoCollected = true;
            await admin.save();

            return {
                message: "Hospital basic information updated successfully",
                hospital: {
                    hospitalId: hospital.hospitalId,
                    name: hospital.name,
                    hospitalType: hospital.hospitalType,
                    registrationNumber: hospital.registrationNumber,
                    yearEstablished: hospital.yearEstablished,
                    googleMapLink: hospital.googleMapLink
                },
                onboardingProgress: admin.getOnboardingProgress(),
                updatedAt: hospital.updatedAt
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            authLogger.error('Error updating hospital basic info:', error);
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                error
            );
        }
    }

    static async getVerificationStatus(userId) {
        try {
            // Check if user exists (could be admin or regular user)
            const admin = await AdminProfile.findOne({ adminId: userId });
            const user = await User.findOne({ userId: userId });
            
            if (!admin && !user) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `User with ID ${userId} not found.`
                );
            }

            const targetUser = admin || user;
            const userType = admin ? 'admin' : 'user';

            return {
                userId: userId,
                userType: userType,
                verificationStatus: targetUser.verificationStatus || 'Pending',
                isActive: targetUser.isActive || false,
                createdAt: targetUser.createdAt,
                lastUpdated: targetUser.updatedAt
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                `Failed to get verification status: ${error.message}`
            );
        }
    }

    static async activateUser(userId) {
        try {
            // Check if user exists (could be admin or regular user)
            const admin = await AdminProfile.findOne({ adminId: userId });
            const user = await User.findOne({ userId: userId });
            
            if (!admin && !user) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `User with ID ${userId} not found.`
                );
            }

            const targetUser = admin || user;
            const userType = admin ? 'admin' : 'user';

            // Update verification status and activate user
            const updateData = {
                verificationStatus: 'Verified',
                isActive: true,
                updatedAt: new Date()
            };

            if (admin) {
                await AdminProfile.findOneAndUpdate(
                    { adminId: userId },
                    updateData,
                    { new: true }
                );
            } else {
                await User.findOneAndUpdate(
                    { userId: userId },
                    updateData,
                    { new: true }
                );
            }

            return {
                userId: userId,
                userType: userType,
                verificationStatus: 'Verified',
                isActive: true,
                activatedAt: new Date(),
                message: `${userType} account activated successfully`
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                `Failed to activate user: ${error.message}`
            );
        }
    }

    async updateHospitalCompleteInfo(adminId, hospitalId, hospitalData) {
        try {
            // Verify admin exists and has access to this hospital
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Admin not found.'
                );
            }

            // Find the hospital by hospitalId (string ID like "H0001")
            const hospital = await Hospital.findOne({ hospitalId: hospitalId });
            if (!hospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital not found.'
                );
            }

            // Verify admin has access to this hospital
            if (admin.hospitalId && admin.hospitalId.toString() !== hospital._id.toString()) {
                throw new EasyQError(
                    'AuthorizationError',
                    httpStatusCode.FORBIDDEN,
                    true,
                    'Admin does not have access to this hospital.'
                );
            }

            // Update hospital fields if provided
            if (hospitalData.name !== undefined) hospital.name = hospitalData.name;
            if (hospitalData.hospitalType !== undefined) hospital.hospitalType = hospitalData.hospitalType;
            if (hospitalData.registrationNumber !== undefined) hospital.registrationNumber = hospitalData.registrationNumber;
            if (hospitalData.yearEstablished !== undefined) hospital.yearEstablished = hospitalData.yearEstablished;
            if (hospitalData.googleMapLink !== undefined) hospital.googleMapLink = hospitalData.googleMapLink;

            // Update address if any address field is provided
            if (hospitalData.address || hospitalData.city || hospitalData.state || hospitalData.pincode) {
                hospital.address = {
                    street: hospitalData.address || hospital.address?.street || '',
                    city: hospitalData.city || hospital.address?.city || '',
                    state: hospitalData.state || hospital.address?.state || '',
                    zipCode: hospitalData.pincode || hospital.address?.zipCode || '',
                    country: hospital.address?.country || "India"
                };
            }

            // Update contact details if provided
            if (hospitalData.phoneNumber !== undefined) hospital.phoneNumber = hospitalData.phoneNumber;
            if (hospitalData.alternativePhone !== undefined) hospital.alternativePhone = hospitalData.alternativePhone;
            if (hospitalData.emailAddress !== undefined) hospital.emailAddress = hospitalData.emailAddress;

            // Update operation details if provided
            if (hospitalData.workingDays !== undefined) hospital.workingDays = hospitalData.workingDays;
            if (hospitalData.startTime !== undefined) hospital.startTime = hospitalData.startTime;
            if (hospitalData.endTime !== undefined) hospital.endTime = hospitalData.endTime;
            if (hospitalData.openAlways !== undefined) hospital.openAlways = hospitalData.openAlways;
            if (hospitalData.maxTokenPerDay !== undefined) hospital.maxTokenPerDay = hospitalData.maxTokenPerDay;
            if (hospitalData.unlimitedToken !== undefined) hospital.unlimitedToken = hospitalData.unlimitedToken;

            await hospital.save();

            return {
                message: "Hospital information updated successfully",
                hospital: {
                    hospitalId: hospital.hospitalId,
                    name: hospital.name,
                    hospitalType: hospital.hospitalType,
                    registrationNumber: hospital.registrationNumber,
                    yearEstablished: hospital.yearEstablished,
                    address: hospital.address,
                    contact: {
                        phoneNumber: hospital.phoneNumber,
                        alternativePhone: hospital.alternativePhone,
                        emailAddress: hospital.emailAddress
                    },
                    operation: {
                        workingDays: hospital.workingDays,
                        startTime: hospital.startTime,
                        endTime: hospital.endTime,
                        openAlways: hospital.openAlways,
                        maxTokenPerDay: hospital.maxTokenPerDay,
                        unlimitedToken: hospital.unlimitedToken
                    }
                },
                updatedAt: hospital.updatedAt
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            authLogger.error('Error updating hospital complete info:', error);
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                error
            );
        }
    }

    async deleteAdmin(adminId) {
        try {
            // Find the admin
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Admin not found.'
                );
            }

            // Get all hospitals associated with this admin
            const hospitals = await Hospital.find({ adminId: adminId });
            const hospitalIds = hospitals.map(h => h.hospitalId);

            // Delete all associated data for each hospital
            for (const hospitalId of hospitalIds) {
                // Delete doctors associated with this hospital
                await Doctor.deleteMany({ hospitalId: hospitalId });
                
                // Delete appointments associated with this hospital
                await Appointment.deleteMany({ hospitalId: hospitalId });
                
                // Delete hospital facilities
                await HospitalDetails.deleteOne({ hospitalId: hospitalId });
                
                // Delete hospital reviews
                await HospitalReview.deleteOne({ hospitalId: hospitalId });
                
                // Delete hospital favorites
                await Favourite.deleteMany({ 'favouriteHospitals.hospitalId': hospitalId });
            }

            // Delete Firebase files for each hospital
            const firebaseDeletionResults = [];
            for (const hospital of hospitals) {
                try {
                    // Delete hospital folder (contains all hospital documents)
                    const hospitalFolderResult = await deleteFolderFromFirebase(`hospitals/${hospital.hospitalId}`);
                    firebaseDeletionResults.push({
                        hospitalId: hospital.hospitalId,
                        hospitalFolder: hospitalFolderResult
                    });
                } catch (error) {
                    authLogger.error(`Error deleting Firebase files for hospital ${hospital.hospitalId}:`, error);
                    firebaseDeletionResults.push({
                        hospitalId: hospital.hospitalId,
                        error: error.message
                    });
                }
            }

            // Delete admin owner documents folder
            let adminFolderResult = { deletedCount: 0 };
            try {
                adminFolderResult = await deleteFolderFromFirebase(`owners/${adminId}`);
            } catch (error) {
                authLogger.error(`Error deleting Firebase files for admin ${adminId}:`, error);
            }

            // Delete all hospitals associated with this admin
            await Hospital.deleteMany({ adminId: adminId });

            // Delete the admin profile
            await AdminProfile.findOneAndDelete({ adminId: adminId });

            return {
                message: "Admin and all associated data deleted successfully",
                deletedAdmin: {
                    adminId: admin.adminId,
                    email: admin.email,
                    username: admin.username
                },
                deletedHospitals: hospitals.map(h => ({
                    hospitalId: h.hospitalId,
                    name: h.name
                })),
                deletedData: {
                    hospitalsCount: hospitals.length,
                    doctorsCount: await Doctor.countDocuments({ hospitalId: { $in: hospitalIds } }),
                    appointmentsCount: await Appointment.countDocuments({ hospitalId: { $in: hospitalIds } }),
                    reviewsCount: await HospitalReview.countDocuments({ hospitalId: { $in: hospitalIds } })
                },
                firebaseDeletion: {
                    adminOwnerFiles: adminFolderResult,
                    hospitalFiles: firebaseDeletionResults
                },
                deletedAt: new Date()
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            authLogger.error('Error deleting admin:', error);
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                error
            );
        }
    }

    static async deleteAccount(userId) {
        try {
            // Check if user exists (could be admin or regular user)
            const admin = await AdminProfile.findOne({ adminId: userId });
            const user = await User.findOne({ userId: userId });
            
            if (!admin && !user) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `User with ID ${userId} not found.`
                );
            }

            const targetUser = admin || user;
            const userType = admin ? 'admin' : 'user';

            // Soft delete - mark as inactive and deleted
            const updateData = {
                isActive: false,
                isDeleted: true,
                deletedAt: new Date(),
                updatedAt: new Date()
            };

            if (admin) {
                await AdminProfile.findOneAndUpdate(
                    { adminId: userId },
                    updateData,
                    { new: true }
                );
            } else {
                await User.findOneAndUpdate(
                    { userId: userId },
                    updateData,
                    { new: true }
                );
            }

            return {
                userId: userId,
                userType: userType,
                deletedAt: new Date(),
                message: `${userType} account deleted successfully`
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                `Failed to delete account: ${error.message}`
            );
        }
    }
}

export default new AdminService();
