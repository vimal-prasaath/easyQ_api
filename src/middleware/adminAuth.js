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

        console.log({decodedPayload})

        // Verify it's an admin or doctor token
        if (!decodedPayload.data || (decodedPayload.data.role !== 'admin' && decodedPayload.data.role !== 'doctor')) {
            authLogger.warn('Admin authentication failed: Token is not for admin or doctor user', {
                role: decodedPayload.data?.role,
                type: decodedPayload.type,
                path: req.path
            });
            return next(new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid token. Admin or doctor access required.'
            ));
        }

        // Find admin or doctor in database
        let userFromDb;
        if (decodedPayload.data.role === 'admin') {
            userFromDb = await AdminProfile.findOne({ adminId: decodedPayload.data.userId });
        } else if (decodedPayload.data.role === 'doctor') {
            const Doctor = (await import('../model/doctor.js')).default;
            userFromDb = await Doctor.findOne({ doctorId: decodedPayload.data.userId });
        }
        
        if (!userFromDb) {
            authLogger.error('Authentication failed: User not found in DB.', { 
                userId: decodedPayload.data.userId,
                role: decodedPayload.data.role,
                path: req.path 
            });
            return next(new EasyQError(
                'AuthenticationError', 
                httpStatusCode.UNAUTHORIZED, 
                true, 
                'Authenticated user not found.'
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
        req.isActive = userFromDb.isActive;

        // === AUTHORIZATION LOGIC ===
        const authenticatedUserId = decodedPayload.data.role === 'admin' ? decodedPayload.data.userId : req.body.adminId;
        console.log({authenticatedUserId, path: req.path, isTrue: req.path.includes('/documents/upload')})
        // Skip authorization check for file upload routes since multer hasn't processed the form data yet
        // Authorization will be handled in the controller after multer processes the form data
        
        const imagePaths = ['nurse/upload-image','/hospital-documents','/owner-documents', '/doctor/upload-image', '/documents/upload']
        if ( imagePaths.some(item => req.path.includes(item)) || (req.path.includes('/documents') && req.path.includes('/appoitment'))) {
        console.log({authenticatedUserId, path: req.path, isTrue2: req.path.includes('/documents/upload')})
           
            authLogger.info('Admin authenticated for file upload route - authorization will be handled in controller', {
                adminId: authenticatedUserId,
                path: req.path
            });
            return next();
        }
        
        // Get resource owner ID from different sources based on route
        let resourceOwnerId;

        const resourcePath = ['nurse/upload-image','nurse/add','/appointsummary','/update-image-url','/owner-documents-url','/hospital-documents-url','/hospital-images-url','/hospital-logo-url','/today-stats','/doctor/all','/doctor/update','/doctor/delete','/doctor/add','/owner-info','/onboarding', '/dashboard', '/hospital/basic-info', '/hospital/complete-info']
        if (resourcePath.some(item => req.path.includes(item))  ) {
            // For admin owner-info/onboarding routes, get adminId from request body
            console.log(req.body)
            resourceOwnerId = req.body.adminId;
        } else {
            // For other routes, get from headers or params
            resourceOwnerId = req.headers['x-user-id'] || req.params.adminId;
        }
        
        if (!resourceOwnerId) {
            authLogger.warn('Admin authorization warning: No specific resource owner ID found in request.', { path: req.path });
            return next(new EasyQError('AuthorizationError', httpStatusCode.BAD_REQUEST, true, 'Resource ID missing for owner/admin authorization check.'));
        }

        console.log({req: req.headers['x-user-id'], new: req.params.adminId, authenticatedUserId, resourceOwnerId})

        
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
