import AdminService from "../services/adminService.js";
import { constructResponse } from "../util/responseFormatter.js";
import { httpStatusCode } from "../util/statusCode.js";
import { authLogger } from "../config/logger.js";
import { EasyQError } from "../config/error.js";

export const adminSignup = async (req, res, next) => {
    try {
        const { email, password, username } = req.body;

        // Validate required fields
        if (!email || !password || !username) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Email, password, and username are required.")
            );
        }

        const result = await AdminService.createAdmin({ email, password, username });

        authLogger.info('Admin signup successful', {
            adminId: result.admin.adminId,
            email: result.admin.email
        });

        return res.status(httpStatusCode.CREATED).json(
            constructResponse(true, httpStatusCode.CREATED, "Admin account created successfully", result)
        );
    } catch (error) {
        next(error);
    }
};

export const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Email and password are required.")
            );
        }

        const result = await AdminService.loginAdmin({ email, password });

        authLogger.info('Admin login successful', {
            adminId: result.admin.adminId,
            email: result.admin.email
        });

        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Admin login successful", result)
        );
    } catch (error) {
        next(error);
    }
};

export const updateOnboardingInfo = async (req, res, next) => {
    try {
        const { 
            adminId,
            // Owner Information
            ownerName,
            ownerMobile,
            ownerProof,
            ownerProofNumber,
            // Basic Information
            hospitalName,
            hospitalType,
            registrationNumber,
            yearEstablished,
            // Address Information
            address,
            city,
            state,
            pincode,
            googleMapLink,
            // Contact Details
            phoneNumber,
            alternativePhone,
            emailAddress,
            // Operation Details
            workingDays,
            startTime,
            endTime,
            openAlways,
            maxTokenPerDay,
            unlimitedToken
        } = req.body;

        // Validate required fields
        if (!adminId || !ownerName || !ownerMobile || !ownerProof || !ownerProofNumber ||
            !hospitalName || !hospitalType || !registrationNumber ||
            !address || !city || !state || !pincode || !phoneNumber || !workingDays) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "All required fields must be provided.")
            );
        }

        // Validate hospital type
        const validTypes = ['Hospital', 'Clinic', 'Consultant'];
        if (!validTypes.includes(hospitalType)) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Hospital type must be one of: Hospital, Clinic, Consultant")
            );
        }

        // Validate proof type
        const validProofs = ['Aadhar', 'PAN', 'Driving License', 'Voter ID'];
        if (!validProofs.includes(ownerProof)) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Proof type must be one of: Aadhar, PAN, Driving License, Voter ID")
            );
        }

        // Validate working days
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const invalidDays = workingDays.filter(day => !validDays.includes(day));
        if (invalidDays.length > 0) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, `Invalid working days: ${invalidDays.join(', ')}`)
            );
        }

        // Validate time format if not open always
        if (!openAlways) {
            if (!startTime || !endTime) {
                return res.status(httpStatusCode.BAD_REQUEST).json(
                    constructResponse(false, httpStatusCode.BAD_REQUEST, "Start time and end time are required when not open always.")
                );
            }

            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
                return res.status(httpStatusCode.BAD_REQUEST).json(
                    constructResponse(false, httpStatusCode.BAD_REQUEST, "Time must be in HH:MM format.")
                );
            }
        }

        // Validate token settings
        if (!unlimitedToken && (!maxTokenPerDay || maxTokenPerDay < 1)) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Max tokens per day must be at least 1 when not unlimited.")
            );
        }

        // Validate email format if provided
        if (emailAddress && !/^\S+@\S+\.\S+$/.test(emailAddress)) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Invalid email format.")
            );
        }

        const result = await AdminService.updateOnboardingInfo(adminId, {
            ownerName,
            ownerMobile,
            ownerProof,
            ownerProofNumber,
            hospitalName,
            hospitalType,
            registrationNumber,
            yearEstablished,
            address,
            city,
            state,
            pincode,
            googleMapLink,
            phoneNumber,
            alternativePhone,
            emailAddress,
            workingDays,
            startTime,
            endTime,
            openAlways,
            maxTokenPerDay,
            unlimitedToken
        });

        authLogger.info('Onboarding info updated successfully', {
            adminId: adminId,
            hospitalName: hospitalName
        });

        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Onboarding information updated successfully", result)
        );
    } catch (error) {
        next(error);
    }
};

export const updateHospitalDocuments = async (req, res, next) => {
    try {
        const { adminId, documentType } = req.body;
        const file = req.file;

        if (!adminId || !documentType) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Missing required fields: adminId or documentType'
            ));
        }

        if (!file) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'No file uploaded or file type/size not allowed'
            ));
        }

        // Authorization check: Verify that the adminId in form data matches the authenticated admin
        const authenticatedAdminId = req.user.data.userId;
        if (adminId !== authenticatedAdminId) {
            return next(new EasyQError(
                'AuthorizationError',
                httpStatusCode.FORBIDDEN,
                true,
                'Admin ID mismatch. You can only upload documents for your own account.'
            ));
        }

        // Validate document type
        const allowedDocumentTypes = ['registrationCertificate', 'accreditation', 'logo', 'hospitalImages'];
        if (!allowedDocumentTypes.includes(documentType)) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid document type. Allowed types: ${allowedDocumentTypes.join(', ')}`
            ));
        }

        const result = await AdminService.updateHospitalDocuments(adminId, file, documentType);
        
        res.status(httpStatusCode.OK).json(result);
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Server error during hospital document upload: ${error.message}`
        ));
    }
};

export const updateOwnerDocuments = async (req, res, next) => {
    try {
        const { adminId, documentType } = req.body;
        const file = req.file;

        if (!adminId || !documentType) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Missing required fields: adminId or documentType'
            ));
        }

        if (!file) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'No file uploaded or file type/size not allowed'
            ));
        }

        // Authorization check: Verify that the adminId in form data matches the authenticated admin
        const authenticatedAdminId = req.user.data.userId;
        if (adminId !== authenticatedAdminId) {
            return next(new EasyQError(
                'AuthorizationError',
                httpStatusCode.FORBIDDEN,
                true,
                'Admin ID mismatch. You can only upload documents for your own account.'
            ));
        }

        // Validate document type
        const allowedDocumentTypes = ['aadharCard', 'panCard'];
        if (!allowedDocumentTypes.includes(documentType)) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid document type. Allowed types: ${allowedDocumentTypes.join(', ')}`
            ));
        }

        const result = await AdminService.updateOwnerDocuments(adminId, file, documentType);
        
        res.status(httpStatusCode.OK).json(result);
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Server error during owner document upload: ${error.message}`
        ));
    }
};

export const getAdminDetails = async (req, res, next) => {
    try {
        const { adminId } = req.params;

        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Admin ID is required.")
            );
        }

        const result = await AdminService.getAdminById(adminId);

        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Admin details retrieved successfully", result)
        );
    } catch (error) {
        next(error);
    }
};

export const getAdminDashboard = async (req, res, next) => {
    try {
        const { adminId } = req.body;
        
        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Admin ID is required")
            );
        }

        const result = await AdminService.getAdminDashboard(adminId);
        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Dashboard data retrieved successfully", result)
        );
    } catch (error) {
        next(error);
    }
};

export const getTodayStats = async (req, res, next) => {
    try {
        const { adminId, date } = req.body;
        
        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Admin ID is required")
            );
        }

        if (!date) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Date is required (format: YYYY-MM-DD)")
            );
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Invalid date format. Use YYYY-MM-DD format")
            );
        }

        const result = await AdminService.getTodayStats(adminId, date);
        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Statistics retrieved successfully", result)
        );
    } catch (error) {
        next(error);
    }
};

export const updateOwnerInfo = async (req, res, next) => {
    try {
        const { adminId, ...ownerData } = req.body;
        
        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Admin ID is required")
            );
        }
        
        // Validate required fields
        if (!ownerData.name || !ownerData.mobile || !ownerData.proof || !ownerData.proofNumber) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "All owner information fields are required")
            );
        }

        const result = await AdminService.updateOwnerInfo(adminId, ownerData);
        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Owner information updated successfully", result)
        );
    } catch (error) {
        next(error);
    }
};

export const updateHospitalBasicInfo = async (req, res, next) => {
    try {
        const { adminId, ...hospitalData } = req.body;
        
        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Admin ID is required")
            );
        }
        
        // Validate required fields
        if (!hospitalData.name || !hospitalData.hospitalType || !hospitalData.registrationNumber || !hospitalData.yearEstablished) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Hospital name, type, registration number, and year established are required")
            );
        }

        const result = await AdminService.updateHospitalBasicInfo(adminId, hospitalData);
        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Hospital basic information updated successfully", result)
        );
    } catch (error) {
        next(error);
    }
};

// Get verification status
export async function getVerificationStatus(req, res, next) {
    const startTime = Date.now();
    
    authLogger.info('Verification status check started', {
        userId: req.user?.userId,
        targetUserId: req.params.userId
    });

    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "userId is required in URL parameters")
            );
        }

        authLogger.info('Verification status check started', {
            userId: req.user?.userId,
            targetUserId: userId
        });

        const result = await AdminService.getVerificationStatus(userId);
        
        const response = constructResponse(true, httpStatusCode.OK, "Verification status retrieved successfully", result);

        authLogger.info('Verification status retrieved successfully', {
            userId: req.user?.userId,
            targetUserId: userId,
            status: result.verificationStatus
        });

        authLogger.info('Verification Status Check', Date.now() - startTime, {
            targetUserId: userId,
            userId: req.user?.userId
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        authLogger.error('Verification status check error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            targetUserId: req.params.userId
        });
        next(error);
    }
}

// Activate user (Admin)
export async function activateUser(req, res, next) {
    const startTime = Date.now();
    
    authLogger.info('User activation started', {
        userId: req.user?.userId,
        targetUserId: req.params.userId
    });

    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "userId is required in URL parameters")
            );
        }

        authLogger.info('User activation started', {
            userId: req.user?.userId,
            targetUserId: userId
        });

        const result = await AdminService.activateUser(userId);
        
        const response = constructResponse(true, httpStatusCode.OK, "User activated successfully", result);

        authLogger.info('User activated successfully', {
            userId: req.user?.userId,
            targetUserId: userId
        });

        authLogger.info('User Activation', Date.now() - startTime, {
            targetUserId: userId,
            userId: req.user?.userId
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        authLogger.error('User activation error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            targetUserId: req.params.userId
        });
        next(error);
    }
}

// Delete account
export async function deleteAccount(req, res, next) {
    const startTime = Date.now();
    
    authLogger.info('Account deletion started', {
        userId: req.user?.userId,
        targetUserId: req.params.userId
    });

    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "userId is required in URL parameters")
            );
        }

        authLogger.info('Account deletion started', {
            userId: req.user?.userId,
            targetUserId: userId
        });

        const result = await AdminService.deleteAccount(userId);
        
        const response = constructResponse(true, httpStatusCode.OK, "Account deleted successfully", result);

        authLogger.info('Account deleted successfully', {
            userId: req.user?.userId,
            targetUserId: userId
        });

        authLogger.info('Account Deletion', Date.now() - startTime, {
            targetUserId: userId,
            userId: req.user?.userId
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        authLogger.error('Account deletion error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            targetUserId: req.params.userId
        });
        next(error);
    }
}

export const deleteAdmin = async (req, res, next) => {
    try {
        const { adminId } = req.params;
        
        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Admin ID is required")
            );
        }

        const result = await AdminService.deleteAdmin(adminId);
        
        authLogger.info('Admin deleted successfully', {
            adminId: adminId
        });

        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Admin and all associated data deleted successfully", result)
        );
    } catch (error) {
        next(error);
    }
};

export const updateHospitalCompleteInfo = async (req, res, next) => {
    try {
        const { adminId, hospitalId, ...hospitalData } = req.body;
        
        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Admin ID is required")
            );
        }

        if (!hospitalId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Hospital ID is required")
            );
        }

        // Validate hospital type if provided
        if (hospitalData.hospitalType) {
            const validTypes = ['Hospital', 'Clinic', 'Consultant'];
            if (!validTypes.includes(hospitalData.hospitalType)) {
                return res.status(httpStatusCode.BAD_REQUEST).json(
                    constructResponse(false, httpStatusCode.BAD_REQUEST, "Hospital type must be one of: Hospital, Clinic, Consultant")
                );
            }
        }

        // Validate working days if provided
        if (hospitalData.workingDays) {
            const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const invalidDays = hospitalData.workingDays.filter(day => !validDays.includes(day));
            if (invalidDays.length > 0) {
                return res.status(httpStatusCode.BAD_REQUEST).json(
                    constructResponse(false, httpStatusCode.BAD_REQUEST, `Invalid working days: ${invalidDays.join(', ')}`)
                );
            }
        }

        // Validate time format if provided
        if (hospitalData.startTime || hospitalData.endTime) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (hospitalData.startTime && !timeRegex.test(hospitalData.startTime)) {
                return res.status(httpStatusCode.BAD_REQUEST).json(
                    constructResponse(false, httpStatusCode.BAD_REQUEST, "Start time must be in HH:MM format")
                );
            }
            if (hospitalData.endTime && !timeRegex.test(hospitalData.endTime)) {
                return res.status(httpStatusCode.BAD_REQUEST).json(
                    constructResponse(false, httpStatusCode.BAD_REQUEST, "End time must be in HH:MM format")
                );
            }
        }

        // Validate token settings if provided
        if (hospitalData.unlimitedToken === false && hospitalData.maxTokenPerDay !== undefined) {
            if (!hospitalData.maxTokenPerDay || hospitalData.maxTokenPerDay < 1) {
                return res.status(httpStatusCode.BAD_REQUEST).json(
                    constructResponse(false, httpStatusCode.BAD_REQUEST, "Max tokens per day must be at least 1 when not unlimited")
                );
            }
        }

        // Validate email format if provided
        if (hospitalData.emailAddress && !/^\S+@\S+\.\S+$/.test(hospitalData.emailAddress)) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, "Invalid email format")
            );
        }

        const result = await AdminService.updateHospitalCompleteInfo(adminId, hospitalId, hospitalData);
        
        authLogger.info('Hospital complete info updated successfully', {
            adminId: adminId,
            hospitalId: hospitalId
        });

        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, "Hospital information updated successfully", result)
        );
    } catch (error) {
        next(error);
    }
};

// New endpoints for updating file URLs (frontend handles upload)
export const updateHospitalLogoUrl = async (req, res, next) => {
    try {
        const { adminId, fileUrl, fileName } = req.body;
        
        if (!adminId || !fileUrl || !fileName) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, 'Admin ID, file URL, and file name are required')
            );
        }

        const result = await AdminService.updateHospitalLogoUrl(adminId, fileUrl, fileName);
        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, 'Hospital logo URL updated successfully', result)
        );
    } catch (error) {
        next(error);
    }
};

export const updateHospitalImagesUrl = async (req, res, next) => {
    try {
        const { adminId, fileUrl, fileName } = req.body;
        
        if (!adminId || !fileUrl || !fileName) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, 'Admin ID, file URL, and file name are required')
            );
        }

        const result = await AdminService.updateHospitalImagesUrl(adminId, fileUrl, fileName);
        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, 'Hospital image URL updated successfully', result)
        );
    } catch (error) {
        next(error);
    }
};

export const updateHospitalDocumentsUrl = async (req, res, next) => {
    try {
        const { adminId, documentType, fileUrl, fileName } = req.body;
        
        if (!adminId || !documentType || !fileUrl || !fileName) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, 'Admin ID, document type, file URL, and file name are required')
            );
        }

        const result = await AdminService.updateHospitalDocumentsUrl(adminId, documentType, fileUrl, fileName);
        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, 'Hospital document URL updated successfully', result)
        );
    } catch (error) {
        next(error);
    }
};

export const updateOwnerDocumentsUrl = async (req, res, next) => {
    try {
        const { adminId, documentType, fileUrl, fileName } = req.body;
        
        if (!adminId || !documentType || !fileUrl || !fileName) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                constructResponse(false, httpStatusCode.BAD_REQUEST, 'Admin ID, document type, file URL, and file name are required')
            );
        }

        const result = await AdminService.updateOwnerDocumentsUrl(adminId, documentType, fileUrl, fileName);
        return res.status(httpStatusCode.OK).json(
            constructResponse(true, httpStatusCode.OK, 'Owner document URL updated successfully', result)
        );
    } catch (error) {
        next(error);
    }
};
