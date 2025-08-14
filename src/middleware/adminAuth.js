import { compareToken } from "../util/tokenGenerator.js";
import { EasyQError } from "../config/error.js"
import { httpStatusCode } from "../util/statusCode.js";
import { authLogger } from "../config/logger.js";
import AdminProfile from "../model/adminProfile.js"

/**
 * Admin-specific authentication and authorization middleware
 * Handles JWT tokens for admin users and resource access control
 */
async function authenticateAdmin(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        authLogger.warn('Admin authentication failed: Missing authorization header', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        return next(new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            'Authorization header is missing. Please provide a JWT.'
        ));
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        authLogger.warn('Admin authentication failed: Invalid authorization header format', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            authHeader: authHeader.substring(0, 20) + '...'
        });
        return next(new EasyQError(
            'AuthenticationError',
            httpStatusCode.UNAUTHORIZED,
            true,
            'Invalid Authorization header format. Must be "Bearer <token>".'
        ));
    }
    
    const token = tokenParts[1];

    try {
        // Decode and verify JWT token
        const decodedPayload = await compareToken(token);

        // Debug: Log the token structure for troubleshooting
        authLogger.debug('Admin JWT Token structure:', {
            hasData: !!decodedPayload.data,
            dataKeys: decodedPayload.data ? Object.keys(decodedPayload.data) : [],
            role: decodedPayload.data?.role,
            userId: decodedPayload.data?.userId,
            path: req.path
        });

        // Verify it's an admin token
        if (!decodedPayload.data || decodedPayload.data.role !== 'admin') {
            authLogger.warn('Admin authentication failed: Token is not for admin user', {
                role: decodedPayload.data?.role,
                path: req.path
            });
            return next(new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid token. Admin access required.'
            ));
        }

        // Find admin in database
        const adminFromDb = await AdminProfile.findOne({ adminId: decodedPayload.data.userId });
        if (!adminFromDb) {
            authLogger.error('Admin authentication failed: Admin not found in DB.', { 
                adminId: decodedPayload.data.userId, 
                path: req.path 
            });
            return next(new EasyQError(
                'AuthenticationError', 
                httpStatusCode.UNAUTHORIZED, 
                true, 
                'Authenticated admin not found.'
            ));
        }

        // Check if admin is active
        // if (!adminFromDb.isActive) {
        //     authLogger.warn('Admin authentication failed: Inactive admin account', {
        //         adminId: decodedPayload.data.userId,
        //         path: req.path
        //     });
        //     return next(new EasyQError(
        //         'AuthenticationError',
        //         httpStatusCode.UNAUTHORIZED,
        //         true,
        //         'Admin account is not active. Please contact administrator.'
        //     ));
        // }

        // Set user data in request
        req.user = decodedPayload;
        req.isActive = adminFromDb.isActive;

        // === AUTHORIZATION LOGIC ===
        const authenticatedUserId = decodedPayload.data.userId;
        
        // Skip authorization check for file upload routes since multer hasn't processed the form data yet
        // Authorization will be handled in the controller after multer processes the form data
        if (req.path.includes('/hospital-documents') || req.path.includes('/owner-documents')) {
            authLogger.info('Admin authenticated for file upload route - authorization will be handled in controller', {
                adminId: authenticatedUserId,
                path: req.path
            });
            return next();
        }
        
        // Get resource owner ID from different sources based on route
        let resourceOwnerId;
        if (req.path.includes('/owner-info') || req.path.includes('/onboarding')) {
            // For admin owner-info/onboarding routes, get adminId from request body
            resourceOwnerId = req.body.adminId;
        } else {
            // For other routes, get from headers or params
            resourceOwnerId = req.headers['x-user-id'] || req.params.adminId;
        }
        
        if (!resourceOwnerId) {
            authLogger.warn('Admin authorization warning: No specific resource owner ID found in request.', { path: req.path });
            return next(new EasyQError('AuthorizationError', httpStatusCode.BAD_REQUEST, true, 'Resource ID missing for owner/admin authorization check.'));
        }
        
        // Check for ID mismatch (security check)
        if (resourceOwnerId !== authenticatedUserId) {
            authLogger.warn('Security Alert: Mismatch between adminId in token and resource owner ID.', {
                path: req.path,
                tokenAdminId: authenticatedUserId,
                resourceOwnerId: resourceOwnerId
            });
            return next(new EasyQError('AuthorizationError', httpStatusCode.BAD_REQUEST, true, 'Admin ID mismatch in request.'));
        }

        authLogger.info('Admin authenticated and authorized successfully', {
            adminId: authenticatedUserId,
            email: decodedPayload.data.email,
            role: decodedPayload.data.role,
            path: req.path,
            method: req.method,
            ip: req.ip
        });

        next();
    } catch (error) {
        authLogger.error('Admin authentication failed: Token validation error', {
            errorName: error.name,
            errorMessage: error.message,
            path: req.path,
            method: req.method,
            ip: req.ip,
            tokenPreview: token.substring(0, 20) + '...'
        });

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

export default authenticateAdmin;
