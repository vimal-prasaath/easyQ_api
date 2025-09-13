import { DoctorAuthService } from '../services/doctorAuthService.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logApiRequest, logApiResponse, logError } from '../config/logger.js';

export async function doctorSignup(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'doctor_signup' });

    try {
        const signupData = req.body;
        
        const result = await DoctorAuthService.doctorSignup(signupData);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: {
                doctorId: result.doctorId,
                email: result.email
            },
            statusCode: httpStatusCode.CREATED
        });

        // Log API response
        logApiResponse(req, response);

        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        logError('Doctor signup error', {
            error: error.message,
            stack: error.stack,
            requestData: req.body
        });
        next(error);
    }
}

export async function doctorLogin(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'doctor_login' });

    try {
        const loginData = req.body;
        
        const result = await DoctorAuthService.doctorLogin(loginData);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: result.data,
            statusCode: httpStatusCode.OK
        });

        // Log API response
        logApiResponse(req, response);

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError('Doctor login error', {
            error: error.message,
            stack: error.stack,
            requestData: req.body
        });
        next(error);
    }
}

export async function getDoctorProfile(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'get_doctor_profile' });

    try {
        const { doctorId } = req.user; // From JWT token
        
        const result = await DoctorAuthService.getDoctorProfile(doctorId);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: result.data,
            statusCode: httpStatusCode.OK
        });

        // Log API response
        logApiResponse(req, response);

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError('Get doctor profile error', {
            error: error.message,
            stack: error.stack,
            doctorId: req.user?.doctorId
        });
        next(error);
    }
}
