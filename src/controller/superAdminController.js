import { SuperAdminService } from '../services/superAdminService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';

/**
 * Super Admin Signup
 * POST /api/super-admin/auth/signup
 */
export const signup = async (req, res, next) => {
    try {
        const signupData = req.body;

        const newSuperAdmin = await SuperAdminService.signup(signupData);

        logInfo('Super admin signup via API', {
            superAdminId: newSuperAdmin.superAdminId,
            username: newSuperAdmin.username
        });

        return res.status(httpStatusCode.CREATED).json({
            status: 'success',
            message: 'Super admin created successfully',
            data: newSuperAdmin
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/auth/signup',
            signupData: req.body
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to create super admin'
        ));
    }
};

/**
 * Super Admin Login
 * POST /api/super-admin/auth/login
 */
export const login = async (req, res, next) => {
    try {
        const loginData = req.body;

        const result = await SuperAdminService.login(loginData);

        logInfo('Super admin login via API', {
            superAdminId: result.superAdmin.superAdminId,
            username: result.superAdmin.username
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Login successful',
            data: result
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/auth/login',
            username: req.body?.username
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to login'
        ));
    }
};

/**
 * Get All Admins
 * GET /api/super-admin/admins?status=pending
 */
export const getAllAdmins = async (req, res, next) => {
    try {
        const { status } = req.query;

        const admins = await SuperAdminService.getAllAdmins(status);

        logInfo('All admins retrieved via API', {
            status: status || 'all',
            count: admins.length
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Admins retrieved successfully',
            data: {
                admins,
                totalCount: admins.length,
                filter: status || 'all'
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/admins',
            status: req.query?.status
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve admins'
        ));
    }
};

/**
 * Hold Admin
 * PUT /api/super-admin/admins/{adminId}/hold
 */
export const holdAdmin = async (req, res, next) => {
    try {
        const { adminId } = req.params;
        const { holdReason, holdBy, canBeApprovedLater } = req.body;

        if (!holdReason || !holdBy) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'holdReason and holdBy are required'
            );
        }

        const updatedAdmin = await SuperAdminService.holdAdmin(adminId, {
            holdReason,
            holdBy,
            canBeApprovedLater
        });

        logInfo('Admin held via API', {
            adminId,
            holdBy,
            holdReason
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Admin put on hold successfully',
            data: updatedAdmin
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/admins/hold',
            adminId: req.params?.adminId,
            holdData: req.body
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to hold admin'
        ));
    }
};

/**
 * Approve Admin
 * PUT /api/super-admin/admins/{adminId}/approve
 */
export const approveAdmin = async (req, res, next) => {
    try {
        const { adminId } = req.params;
        const { approvedBy } = req.body;

        if (!approvedBy) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'approvedBy is required'
            );
        }

        const updatedAdmin = await SuperAdminService.approveAdmin(adminId, approvedBy);

        logInfo('Admin approved via API', {
            adminId,
            approvedBy
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Admin approved successfully',
            data: updatedAdmin
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/admins/approve',
            adminId: req.params?.adminId,
            approvedBy: req.body?.approvedBy
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to approve admin'
        ));
    }
};

/**
 * Reject Admin
 * PUT /api/super-admin/admins/{adminId}/reject
 */
export const rejectAdmin = async (req, res, next) => {
    try {
        const { adminId } = req.params;
        const { rejectedBy, reason } = req.body;

        if (!rejectedBy) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'rejectedBy is required'
            );
        }

        const updatedAdmin = await SuperAdminService.rejectAdmin(adminId, rejectedBy, reason);

        logInfo('Admin rejected via API', {
            adminId,
            rejectedBy,
            reason
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Admin rejected successfully',
            data: updatedAdmin
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/admins/reject',
            adminId: req.params?.adminId,
            rejectedBy: req.body?.rejectedBy
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to reject admin'
        ));
    }
};

/**
 * Get All Users with Pagination
 * GET /api/super-admin/users?page=1&limit=10
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const { page, limit } = req.query;

        const result = await SuperAdminService.getAllUsers({ page, limit });

        logInfo('All users retrieved via API', {
            page: result.pagination.currentPage,
            limit: result.pagination.limit,
            totalCount: result.pagination.totalCount
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Users retrieved successfully',
            data: result
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/users',
            page: req.query?.page,
            limit: req.query?.limit
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve users'
        ));
    }
};

/**
 * Get User Appointments History
 * GET /api/super-admin/users/{userId}/appointments?date=2024-01-01&status=Completed&startDate=2024-01-01&endDate=2024-01-31
 */
export const getUserAppointments = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { date, status, startDate, endDate } = req.query;

        if (!userId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID is required'
            );
        }

        const appointments = await SuperAdminService.getUserAppointments(userId, {
            date,
            status,
            startDate,
            endDate
        });

        logInfo('User appointments retrieved via API', {
            userId,
            filterData: { date, status, startDate, endDate },
            count: appointments.length
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'User appointments retrieved successfully',
            data: {
                userId,
                appointments,
                totalCount: appointments.length,
                filters: { date, status, startDate, endDate }
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/users/appointments',
            userId: req.params?.userId,
            filters: req.query
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve user appointments'
        ));
    }
};
