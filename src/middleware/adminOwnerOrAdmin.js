
import { EasyQError } from "../config/error.js";
import { httpStatusCode } from "../util/statusCode.js";
import { authLogger } from "../config/logger.js";

async function authorizeOwnerOrAdmin(req, res, next) {
    if (!req.user || !req.user.data) {
        authLogger.error('Owner/Admin authorization failed: req.user data not found. Authentication middleware likely skipped or failed.', { path: req.path });
        return next(new EasyQError('AuthorizationError', httpStatusCode.FORBIDDEN, true, 'User information not available for authorization.'));
    }

    const authenticatedUserId = req.user.data.userId;
    const authenticatedUserRole = req.user.data.role;
    const userRole = req.user.data.role;
    const resourceOwnerId = req.headers['x-user-id'];
    const isActive = req.isActive
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
    if (!isActive && userRole === "admin") {
        authLogger.warn('Security Alert: Inactive user attempting to access resource. Contact admin for authorization.', {
            userId: authenticatedUserId,
            role: userRole,
            path: req.path
        });
        return next(new EasyQError('AuthorizationError', httpStatusCode.FORBIDDEN, true, 'Your account is currently inactive. Please contact an administrator for access.'));
    }


    let actualOwnerId = resourceOwnerId;
    if (authenticatedUserId === resourceOwnerId || authenticatedUserRole === 'admin') {
        authLogger.debug('Owner/Admin Authorization granted', {
            authenticatedUserId,
            resourceOwnerId: actualOwnerId,
            role: authenticatedUserRole,
            path: req.path
        });
        next();
    } else {
        authLogger.warn('Owner/Admin Authorization denied: Unauthorized attempt to access another user\'s content', {
            authenticatedUserId: authenticatedUserIdFromToken,
            resourceOwnerId: resourceOwnerId,
            role: authenticatedUserRole,
            path: req.path,
            userIdFromCustomHeader: userIdFromCustomHeader
        });
        return next(new EasyQError('AuthorizationError', httpStatusCode.FORBIDDEN, true, 'You are not authorized to access this content.'));

    }

}

export default authorizeOwnerOrAdmin;