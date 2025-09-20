import { NurseService } from '../services/nurseService.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { httpStatusCode } from '../util/statusCode.js';
import { nurseLogger, logApiRequest, logApiResponse, logPerformance } from '../config/logger.js';

export async function createNurse(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'create_nurse' });

    try {
        const nurseData = req.body;
        const { adminId } = nurseData;
        
        // Validate adminId
        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "adminId is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }
        
        nurseLogger.info('Nurse creation started', {
            userId: req.user?.userId,
            adminId: adminId,
            nurseName: nurseData.name,
            nurseEmail: nurseData.email,
            hospitalId: nurseData.hospitalId
        });

        const result = await NurseService.createNurse(nurseData);

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Nurse created successfully",
            data: result,
            statusCode: httpStatusCode.CREATED
        });

        nurseLogger.info('Nurse created successfully', {
            userId: req.user?.userId,
            adminId: adminId,
            nurseId: result.nurseId,
            nurseName: result.name,
            hospitalId: result.hospitalId
        });

        // Log performance
        logPerformance('Nurse Creation', Date.now() - startTime, {
            nurseId: result.nurseId,
            userId: req.user?.userId,
            adminId: adminId
        });

        // Log API response
        logApiResponse(req, res, response, { 
            action: 'create_nurse_success',
            nurseId: result.nurseId,
            adminId: adminId
        });
        
        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        nurseLogger.error('Nurse creation error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            requestData: req.body
        });
        next(error);
    }
}

export async function getNurse(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'get_nurse' });

    try {
        const { nurseId } = req.body;
        
        if (!nurseId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "nurseId is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }
        
        nurseLogger.info('Nurse retrieval started', {
            userId: req.user?.userId,
            nurseId
        });

        const nurse = await NurseService.getNurseById(nurseId);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Nurse retrieved successfully",
            data: { nurse },
            statusCode: httpStatusCode.OK
        });

        nurseLogger.info('Nurse retrieved successfully', {
            userId: req.user?.userId,
            nurseId: nurse.nurseId,
            nurseName: nurse.name
        });

        // Log performance
        logPerformance('Nurse Retrieval', Date.now() - startTime, {
            nurseId,
            userId: req.user?.userId
        });

        // Log API response
        logApiResponse(req, res, response, { 
            action: 'get_nurse_success',
            nurseId: nurse.nurseId 
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        nurseLogger.error('Nurse retrieval error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            nurseId: req.body.nurseId
        });
        next(error);
    }
}

export async function deleteNurse(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'delete_nurse' });

    try {
        const { nurseId, adminId } = req.body;
        
        if (!nurseId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "nurseId is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }
        
        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "adminId is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }
        
        nurseLogger.info('Nurse deletion started', {
            userId: req.user?.userId,
            adminId: adminId,
            nurseId
        });

        const deletedNurse = await NurseService.deleteNurse(nurseId);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Nurse deleted successfully",
            data: { deletedNurse },
            statusCode: httpStatusCode.OK
        });

        nurseLogger.info('Nurse deleted successfully', {
            userId: req.user?.userId,
            adminId: adminId,
            nurseId: deletedNurse.nurseId,
            nurseName: deletedNurse.name
        });

        // Log performance
        logPerformance('Nurse Deletion', Date.now() - startTime, {
            nurseId,
            userId: req.user?.userId,
            adminId: adminId
        });

        // Log API response
        logApiResponse(req, res, response, { 
            action: 'delete_nurse_success',
            nurseId: deletedNurse.nurseId,
            adminId: adminId
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function updateNurse(req, res, next) {
    try {
        const { nurseId, ...updates } = req.body;
        
        if (!nurseId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "nurseId is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }
        
        const updatedNurse = await NurseService.updateNurse(nurseId, updates);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: 'Nurse updated successfully',
            data: { nurse: updatedNurse },
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function getAllNurse(req, res, next) {
    try {
        const { hospitalId } = req.params;
        const result = await NurseService.getNursesByHospital(hospitalId);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Nurses retrieved successfully",
            data: result,
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function uploadNurseImage(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'upload_nurse_image' });

    try {
        const { nurseId, adminId } = req.body;
        const file = req.file;

        if (!nurseId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "nurseId is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }

        if (!adminId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "adminId is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }

        if (!file) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "No file uploaded or file type/size not allowed",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }

        nurseLogger.info('Nurse image upload started', {
            userId: req.user?.userId,
            adminId: adminId,
            nurseId: nurseId,
            fileName: file.originalname,
            fileSize: file.size
        });

        const result = await NurseService.uploadNurseImage(nurseId, file);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Nurse image uploaded successfully",
            data: result,
            statusCode: httpStatusCode.OK
        });

        nurseLogger.info('Nurse image uploaded successfully', {
            userId: req.user?.userId,
            adminId: adminId,
            nurseId: nurseId,
            fileName: result.profileImageUrl
        });

        // Log performance
        logPerformance('Nurse Image Upload', Date.now() - startTime, {
            nurseId: nurseId,
            userId: req.user?.userId,
            adminId: adminId
        });

        // Log API response
        logApiResponse(req, res, response, { 
            action: 'upload_nurse_image_success',
            nurseId: nurseId,
            adminId: adminId
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        nurseLogger.error('Nurse image upload error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            nurseId: req.body.nurseId
        });
        next(error);
    }
}

// New endpoint for updating nurse profile image URL (frontend handles upload)
export const updateNurseImageUrl = async (req, res, next) => {
    try {
        const { adminId, nurseId, fileUrl, fileName } = req.body;
        
        if (!adminId || !nurseId || !fileUrl || !fileName) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "Admin ID, nurse ID, file URL, and file name are required",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }

        const result = await NurseService.updateNurseImageUrl(adminId, nurseId, fileUrl, fileName);
        return res.status(httpStatusCode.OK).json(
            ResponseFormatter.formatSuccessResponse({
                message: "Nurse profile image URL updated successfully",
                data: result,
                statusCode: httpStatusCode.OK
            })
        );
    } catch (error) {
        next(error);
    }
};
