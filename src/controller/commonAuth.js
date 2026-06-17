import { CommonAuthService } from '../services/commonAuthService.js';
import { StaffAuthTokenService } from '../util/staffAuthTokenService.js';
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
    logApiRequest(req, { action: 'common_login' });

    try {
        const loginData = req.body;
        const result = await CommonAuthService.login(loginData);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: result.data,
            statusCode: httpStatusCode.OK
        });

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

export async function refresh(req, res, next) {
    logApiRequest(req, { action: 'common_refresh_token' });

    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse(
                    'Refresh token is required.',
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true
                )
            );
        }

        const result = await StaffAuthTokenService.refresh(refreshToken);

        const response = ResponseFormatter.formatSuccessResponse({
            message: 'Token refreshed successfully',
            data: result,
            statusCode: httpStatusCode.OK
        });

        logApiResponse(req, response);
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError('Common refresh token error', {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
}

export async function logout(req, res, next) {
    logApiRequest(req, { action: 'common_logout' });

    try {
        const userId = req.user.data?.userId;
        const role = req.user.data?.role;
        const result = await StaffAuthTokenService.logout(userId, role);

        const response = ResponseFormatter.formatSuccessResponse({
            message: 'Logout successful',
            data: result,
            statusCode: httpStatusCode.OK
        });

        logApiResponse(req, response);
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError('Common logout error', {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
}
