import { DoctorService } from '../services/doctorService.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { httpStatusCode } from '../util/statusCode.js';
import { doctorLogger, logApiRequest, logApiResponse, logPerformance } from '../config/logger.js';

export async function createDoctor(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'create_doctor' });

    try {
        const doctorData = req.body;
        
        doctorLogger.info('Doctor creation started', {
            userId: req.user?.userId,
            doctorName: doctorData.name,
            doctorEmail: doctorData.email,
            hospitalId: doctorData.hospitalId
        });

        const result = await DoctorService.createDoctor(doctorData);
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Doctor created successfully",
            data: result,
            statusCode: httpStatusCode.CREATED
        });

        doctorLogger.info('Doctor created successfully', {
            userId: req.user?.userId,
            doctorId: result.doctorId,
            doctorName: result.name,
            hospitalId: result.hospitalId
        });

        // Log performance
        logPerformance('Doctor Creation', Date.now() - startTime, {
            doctorId: result.doctorId,
            userId: req.user?.userId
        });

        // Log API response
        logApiResponse(req, res, response, { 
            action: 'create_doctor_success',
            doctorId: result.doctorId 
        });
        
        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        doctorLogger.error('Doctor creation error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            requestData: req.body
        });
        next(error);
    }
}

export async function getDoctor(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'get_doctor' });

    try {
        const { doctorId } = req.params;
        
        doctorLogger.info('Doctor retrieval started', {
            userId: req.user?.userId,
            doctorId
        });

        const doctor = await DoctorService.getDoctorById(doctorId);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Doctor retrieved successfully",
            data: { doctor },
            statusCode: httpStatusCode.OK
        });

        doctorLogger.info('Doctor retrieved successfully', {
            userId: req.user?.userId,
            doctorId: doctor.doctorId,
            doctorName: doctor.name
        });

        // Log performance
        logPerformance('Doctor Retrieval', Date.now() - startTime, {
            doctorId,
            userId: req.user?.userId
        });

        // Log API response
        logApiResponse(req, res, response, { 
            action: 'get_doctor_success',
            doctorId: doctor.doctorId 
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        doctorLogger.error('Doctor retrieval error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            doctorId: req.params.doctorId
        });
        next(error);
    }
}


export async function deleteDoctor(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'delete_doctor' });

    try {
        const { doctorId } = req.params;
        
        doctorLogger.info('Doctor deletion started', {
            userId: req.user?.userId,
            doctorId
        });

        const deletedDoctor = await DoctorService.deleteDoctor(doctorId);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Doctor deleted successfully",
            data: { deletedDoctor },
            statusCode: httpStatusCode.OK
        });

        doctorLogger.info('Doctor deleted successfully', {
            userId: req.user?.userId,
            doctorId: deletedDoctor.doctorId,
            doctorName: deletedDoctor.name
        });

        // Log performance
        logPerformance('Doctor Deletion', Date.now() - startTime, {
            doctorId,
            userId: req.user?.userId
        });

        // Log API response
        logApiResponse(req, res, response, { 
            action: 'delete_doctor_success',
            doctorId: deletedDoctor.doctorId 
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}


export async function updateDoctor(req, res, next) {
    try {
        const { doctorId } = req.params;
        const updates = req.body;
        
        const updatedDoctor = await DoctorService.updateDoctor(doctorId, updates);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: 'Doctor updated successfully',
            data: { doctor: updatedDoctor },
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}



export async function getAllDoctor(req, res, next) {
    try {
        const { hospitalId } = req.params;
        const result = await DoctorService.getDoctorsByHospital(hospitalId);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Doctors retrieved successfully",
            data: result,
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}


