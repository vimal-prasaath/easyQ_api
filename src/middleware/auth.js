import { compareToken } from "../util/tokenGenerator.js";
import { EasyQError } from "../config/error.js"
import { httpStatusCode } from "../util/statusCode.js";
async function authenticate(req, res, next) {
    if (req.isAuthenticated) {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            'Authorization header is missing. Please provide a JWT.'
        ));
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return next(new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            'Invalid Authorization header format. Must be "Bearer <token>".'
        ));
    }

    const token = tokenParts[1];

    try {
        const decodedPayload = await compareToken(token);
        req.user = decodedPayload;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Authentication failed: Token expired.'
            ));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Authentication failed: Invalid token.'
            ));
        }
        next(error);
    }
}

export default authenticate;