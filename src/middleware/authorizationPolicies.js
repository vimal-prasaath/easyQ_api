import { EasyQError } from "../config/error.js";
import { httpStatusCode } from "../util/statusCode.js";
import { authLogger } from "../config/logger.js";
import authorizationPolicies from '../policies/index.js'; // Import the centralized policies

/**
 * Manages authorization policies based on user roles, actions, and resource types.
 * This class provides a structured way to define and enforce access control.
 */
class AuthorizationManager {

    static authorize(action, resourceType) {
        return async (req, res, next) => {
           
            if (!req.user|| typeof req.isActive === 'undefined') {
                authLogger.error('Authorization failed: Authentication data missing. Ensure authenticate middleware runs first.', { path: req.path });
                return next(new EasyQError(
                    'AuthorizationError',
                    httpStatusCode.FORBIDDEN,
                    true,
                    'Authentication required. User information is missing.'
                ));
            }

            const userRole = req.user?.role || (req.user?.data ? req.user?.data?.role : undefined);
            const authenticatedUserId =  req.user?.data?.userId || req.user?.user_id;
            const isActive = req.isActive;

            if (!userRole) {
                authLogger.error('Authorization failed: User role not found in token payload.', { userId: authenticatedUserId, path: req.path });
                return next(new EasyQError(
                    'AuthorizationError',
                    httpStatusCode.FORBIDDEN,
                    true,
                    'User role information is missing. You are not authorized.'
                ));
            }

            // 1. Check if the user's account is active
            if (!isActive) {
                authLogger.warn('Authorization denied: Inactive user attempting to access resource.', {
                    userId: authenticatedUserId,
                    role: userRole,
                    path: req.path
                });
                return next(new EasyQError(
                    'AuthorizationError',
                    httpStatusCode.FORBIDDEN,
                    true,
                    'Your account is currently inactive. Please contact an administrator for access.'
                ));
            }

            // Get the policy for the user's role from the imported policies
            const rolePolicy = authorizationPolicies[userRole];
            if (!rolePolicy) {
                authLogger.warn('Authorization denied: No policy defined for user role.', { userId: authenticatedUserId, role: userRole, path: req.path });
                return next(new EasyQError(
                    'AuthorizationError',
                    httpStatusCode.FORBIDDEN,
                    true,
                    'You do not have the necessary permissions to access this resource.'
                ));
            }
   
            const resourcePolicy = rolePolicy[resourceType]; 
            if (!resourcePolicy) {
                authLogger.warn('Authorization denied: No policy defined for resource type or "any" fallback.', { userId: authenticatedUserId, role: userRole, resourceType: resourceType, path: req.path });
                return next(new EasyQError(
                    'AuthorizationError',
                    httpStatusCode.FORBIDDEN,
                    true,
                    'You do not have the necessary permissions to access this resource.'
                ));
            }

            // Get the specific action permission
            let permission = resourcePolicy[action];

            // If a resourceIdParamName is provided, get the resource ID from the request
            let resourceId =req.headers['x-user-id'];

            // Evaluate the permission
            let isAuthorized = false;
            if (typeof permission === 'boolean') {
                isAuthorized = permission;
            } else if (typeof permission === 'function') {
                try {
                 isAuthorized = await permission(req, req.user, resourceId); 
                } catch (error) {
                    authLogger.error('Error evaluating dynamic authorization policy function.', {
                        userId: authenticatedUserId,
                        role: userRole,
                        action,
                        resourceType,
                        error: error.message,
                        path: req.path
                    });
                    return next(new EasyQError(
                        'AuthorizationError',
                        httpStatusCode.INTERNAL_SERVER_ERROR,
                        true,
                        'An error occurred during authorization check.'
                    ));
                }
            }

            if (isAuthorized) {
                authLogger.debug('Policy-based authorization granted', {
                    userId: authenticatedUserId,
                    role: userRole,
                    action,
                    resourceType,
                    resourceId: resourceId || 'N/A',
                    path: req.path
                });
                next();
            } else {
                authLogger.warn('Policy-based authorization denied: Insufficient permissions for action on resource.', {
                    userId: authenticatedUserId,
                    role: userRole,
                    action,
                    resourceType,
                    resourceId: resourceId || 'N/A',
                    path: req.path
                });
                return next(new EasyQError(
                    'AuthorizationError',
                    httpStatusCode.FORBIDDEN,
                    true,
                    `You do not have permission to ${action} this ${resourceType}.`
                ));
            }
        };
    }
}

export default AuthorizationManager;

