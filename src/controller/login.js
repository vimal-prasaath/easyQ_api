
import { AuthService } from '../services/authService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logApiRequest, logApiResponse } from '../config/logger.js';
import { constructResponse } from '../util/responseFormatter.js';

export async function login(req, res, next) {
    const {phoneNumber } = req.body;
   
    
    // Log API request
    logApiRequest(req, { action: 'login_attempt', phoneNumber });

    try {
        const loginResult = await AuthService.login(phoneNumber);
        
        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Login successful',
            loginResult
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}