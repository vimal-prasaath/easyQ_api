import { EasyQError } from "../config/error.js";
import { httpStatusCode } from "../util/statusCode.js";
import { authLogger } from "../config/logger.js";

async function authorizeRoles(req, res, next) {

        if (!req.user || !req.user.data || !req.user.data.role) {
            authLogger.error('Role authorization failed: User or role data missing in req.user.', { path: req.path });
            return next(new EasyQError(
                'AuthorizationError',
                httpStatusCode.FORBIDDEN,
                true,
                'You are not authorized to access this resource. User role information is missing.'
            ));
        }

        const userRole = req.user.data.role;
        const resourceOwnerId = req.headers['x-user-id'];
        const authenticatedUserId = req.user.data.userId;
        const isActive=req.isActive
        console.log(isActive,resourceOwnerId)
        if (!resourceOwnerId) {
            authLogger.warn('Owner/Admin authorization warning: No specific resource owner ID found in request parameters for this route.', { path: req.path });
            return next(new EasyQError('AuthorizationError', httpStatusCode.BAD_REQUEST, true, 'Resource ID missing for owner/admin authorization check.'));
        }
        if (resourceOwnerId && resourceOwnerId !== authenticatedUserId) {
            authLogger.warn('Security Alert: Mismatch between userId in custom header and userId in token payload.', {
                path: req.path,
                tokenUserId: authenticatedUserId,
                headerUserId: resourceOwnerId
            });
            return next(new EasyQError('AuthorizationError', httpStatusCode.BAD_REQUEST, true, 'User ID mismatch in request.'));
        }
        if(!isActive){
            authLogger.warn('Security Alert: Inactive user attempting to access resource. Contact admin for authorization.', {
            userId: authenticatedUserId,
            role: userRole,
            path: req.path
        });
        return next(new EasyQError('AuthorizationError', httpStatusCode.FORBIDDEN, true, 'Your account is currently inactive. Please contact an administrator for access.'));
    }

        if (userRole === "admin" && isActive ) {
            authLogger.debug('Role authorization granted', {
                userId: req.user.data.userId,
                role: userRole,
                allowedRoles: "Admin",
                path: req.path
            });
            next(); // User has an allowed role, proceed to the next middleware/route handler
        } else {
            // User's role is not in the allowed list
            authLogger.warn('Role authorization denied: Insufficient role permissions', {
                userId: req.user.data.userId,
                role: userRole,
                requiredRoles: "Admin",
                path: req.path
            });
            return next(new EasyQError(
                'AuthorizationError',
                httpStatusCode.FORBIDDEN,
                true,
                `You do not have the necessary permissions Admin to access this resource.`
            ));
        }
    
}

export default authorizeRoles;