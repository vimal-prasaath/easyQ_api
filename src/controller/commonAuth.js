import { CommonAuthService } from '../services/commonAuthService.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logApiRequest, logApiResponse, logError } from '../config/logger.js';

export async function signup(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'common_signup' });

    try {
        const signupData = req.body;
        
        const result = await CommonAuthService.signup(signupData);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: {
                userId: result.userId,
                userType: result.userType,
                email: result.email
            },
            statusCode: httpStatusCode.CREATED
        });

        // Log API response
        logApiResponse(req, response);

        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        logError('Common signup error', {
            error: error.message,
            stack: error.stack,
            requestData: req.body
        });
        next(error);
    }
}

export async function login(req, res, next) {
    const startTime = Date.now();
    
    // Log API request
    logApiRequest(req, { action: 'common_login' });

    try {
        const loginData = req.body;
        
        const result = await CommonAuthService.login(loginData);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: result.data,
            statusCode: httpStatusCode.OK
        });

        // Log API response
        logApiResponse(req, response);

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError('Common login error', {
            error: error.message,
            stack: error.stack,
            requestData: req.body
        });
        next(error);
    }
}
