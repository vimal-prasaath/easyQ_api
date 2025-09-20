import { NurseAuthService } from '../services/nurseAuthService.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logApiRequest, logApiResponse, logError } from '../config/logger.js';

export async function nurseSignup(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'nurse_signup' });

    try {
        const signupData = req.body;
        
        const result = await NurseAuthService.nurseSignup(signupData);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: {
                nurseId: result.nurseId,
                email: result.email
            },
            statusCode: httpStatusCode.CREATED
        });

        // Log API response
        logApiResponse(req, response);

        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        logError('Nurse signup error', {
            error: error.message,
            stack: error.stack,
            requestData: req.body
        });
        next(error);
    }
}

export async function nurseLogin(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'nurse_login' });

    try {
        const loginData = req.body;
        
        const result = await NurseAuthService.nurseLogin(loginData);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: result.data,
            statusCode: httpStatusCode.OK
        });

        // Log API response
        logApiResponse(req, response);

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError('Nurse login error', {
            error: error.message,
            stack: error.stack,
            requestData: req.body
        });
        next(error);
    }
}

export async function getNurseProfile(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'get_nurse_profile' });

    try {
        const nurseId = req.user.nurseId || req.user.data?.userId; // From JWT token
        
        const result = await NurseAuthService.getNurseProfile(nurseId);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: result.data,
            statusCode: httpStatusCode.OK
        });

        // Log API response
        logApiResponse(req, response);

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError('Get nurse profile error', {
            error: error.message,
            stack: error.stack,
            nurseId: req.user?.nurseId
        });
        next(error);
    }
}
