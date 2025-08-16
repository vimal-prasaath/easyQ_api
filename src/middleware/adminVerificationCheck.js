import { EasyQError } from "../config/error.js";
import { httpStatusCode } from "../util/statusCode.js";
import { authLogger } from "../config/logger.js";
import AdminProfile from "../model/adminProfile.js";

// Array of routes that require admin verification
const ADMIN_VERIFICATION_REQUIRED_ROUTES = [
    '/doctor/add',
    '/doctor/delete', 
    '/doctor/upload-image',
    '/doctor/update',
];

async function adminVerificationCheck(req, res, next) {
    try {
        // Check if current route requires admin verification
        const currentPath = req.path;
        const requiresVerification = ADMIN_VERIFICATION_REQUIRED_ROUTES.includes(currentPath);

        // If route doesn't require verification, skip the check
        if (!requiresVerification) {
            authLogger.debug('Admin verification check: Route does not require verification, skipping.', {
                path: currentPath
            });
            return next();
        }

        if (!req.user) {
            authLogger.error('Admin verification check failed: User data missing in req.user.', { path: req.path });
            return next(new EasyQError(
                'AuthorizationError',
                httpStatusCode.FORBIDDEN,
                true,
                'Authentication required. User information is missing.'
            ));
        }

        const authenticatedUserId = req.user.data?.userId;
        const userRole = req.user.data?.role || 'N/A';

        // Only check verification status for admin users
        if (userRole !== 'admin') {
            authLogger.debug('Admin verification check: User is not admin, skipping verification check.', {
                userId: authenticatedUserId,
                role: userRole,
                path: req.path
            });
            return next();
        }

        // Check admin verification status
        const admin = await AdminProfile.findOne({ adminId: authenticatedUserId });
        
        if (!admin) {
            authLogger.error('Admin verification check failed: Admin profile not found.', {
                userId: authenticatedUserId,
                path: req.path
            });
            return next(new EasyQError(
                'AuthorizationError',
                httpStatusCode.FORBIDDEN,
                true,
                'Admin profile not found.'
            ));
        }

        if (admin.verificationStatus !== 'Approved') {
            authLogger.warn('Admin verification check denied: Admin not approved.', {
                userId: authenticatedUserId,
                verificationStatus: admin.verificationStatus,
                path: req.path
            });
            return next(new EasyQError(
                'AuthorizationError',
                httpStatusCode.FORBIDDEN,
                true,
                'Your admin account is not yet approved. Please wait for approval before managing doctors.'
            ));
        }

        authLogger.debug('Admin verification check passed: Admin is approved.', {
            userId: authenticatedUserId,
            verificationStatus: admin.verificationStatus,
            path: req.path
        });

        next();
    } catch (error) {
        authLogger.error('Admin verification check error:', error);
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Error checking admin verification status.'
        ));
    }
}

export default adminVerificationCheck;
