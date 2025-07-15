import { AuthService } from '../services/authService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logApiRequest, logApiResponse } from '../config/logger.js';
import { constructResponse } from '../util/responseFormatter.js';

export async function signUp(req, res, next) {
    const data = req.body;

    // Log API request
    logApiRequest(req, { action: 'signup_attempt', email: data.email });

    try {
        const signupResult = await AuthService.createUser(data);
        
        const response = constructResponse(
            true,
            httpStatusCode.CREATED,
            'User registration successful',
            signupResult
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        console.log(error)
        next(error);
    }
}