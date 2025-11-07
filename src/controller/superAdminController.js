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

/**
 * Get All Appointments by Hospital
 * GET /api/super-admin/hospitals/{hospitalId}/appointments?date=2024-01-01&status=Completed&startDate=2024-01-01&endDate=2024-01-31
 */
export const getAppointmentsByHospital = async (req, res, next) => {
    try {
        const { hospitalId } = req.params;
        const { date, status, startDate, endDate } = req.query;

        if (!hospitalId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required'
            );
        }

        const result = await SuperAdminService.getAppointmentsByHospital(hospitalId, {
            date,
            status,
            startDate,
            endDate
        });

        logInfo('Hospital appointments retrieved via API', {
            hospitalId: result.hospitalId,
            hospitalName: result.hospitalName,
            filterData: { date, status, startDate, endDate },
            count: result.appointments.length
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Hospital appointments retrieved successfully',
            data: {
                hospitalId: result.hospitalId,
                hospitalName: result.hospitalName,
                appointments: result.appointments,
                totalCount: result.appointments.length,
                filters: { date, status, startDate, endDate }
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/hospitals/appointments',
            hospitalId: req.params?.hospitalId,
            filters: req.query
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve hospital appointments'
        ));
    }
};

/**
 * Get All Documents by Hospital
 * GET /api/super-admin/hospitals/{hospitalId}/documents
 */
export const getDocumentsByHospital = async (req, res, next) => {
    try {
        const { hospitalId } = req.params;

        if (!hospitalId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required'
            );
        }

        const result = await SuperAdminService.getDocumentsByHospital(hospitalId);

        logInfo('Hospital documents retrieved via API', {
            hospitalId: result.hospitalId,
            hospitalName: result.hospitalName,
            patientsCount: result.patientsWithDocuments.length
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Hospital documents retrieved successfully',
            data: {
                hospitalId: result.hospitalId,
                hospitalName: result.hospitalName,
                patientsWithDocuments: result.patientsWithDocuments,
                totalPatients: result.patientsWithDocuments.length,
                totalDocuments: result.patientsWithDocuments.reduce((sum, patient) => sum + patient.totalDocuments, 0)
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/hospitals/documents',
            hospitalId: req.params?.hospitalId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve hospital documents'
        ));
    }
};

/**
 * Get All Followups by Hospital
 * GET /api/super-admin/hospitals/{hospitalId}/followups
 */
export const getFollowupsByHospital = async (req, res, next) => {
    try {
        const { hospitalId } = req.params;

        if (!hospitalId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required'
            );
        }

        const result = await SuperAdminService.getFollowupsByHospital(hospitalId);

        logInfo('Hospital followups retrieved via API', {
            hospitalId: result.hospitalId,
            hospitalName: result.hospitalName,
            patientsCount: result.patientsWithFollowups.length
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Hospital followups retrieved successfully',
            data: {
                hospitalId: result.hospitalId,
                hospitalName: result.hospitalName,
                patientsWithFollowups: result.patientsWithFollowups,
                totalPatients: result.patientsWithFollowups.length,
                totalFollowups: result.patientsWithFollowups.reduce((sum, patient) => sum + patient.totalFollowups, 0)
            }
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/hospitals/followups',
            hospitalId: req.params?.hospitalId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve hospital followups'
        ));
    }
};

/**
 * Get Follow-up Appointments List
 * GET /api/super-admin/appointments/followups?hospitalId=H0001&startDate=2024-01-01&endDate=2024-01-31
 */
export const getFollowupList = async (req, res, next) => {
    try {
        const { hospitalId, startDate, endDate } = req.query;

        const result = await SuperAdminService.getFollowupList(hospitalId || null, {
            startDate,
            endDate
        });

        logInfo('Follow-up list retrieved via API', {
            level: result.level,
            hospitalId: result.hospitalId,
            count: result.totalCount
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Follow-up appointments retrieved successfully',
            data: result
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/appointments/followups',
            query: req.query
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve follow-up appointments'
        ));
    }
};

/**
 * Get Check-in Appointments List
 * GET /api/super-admin/appointments/checkins?hospitalId=H0001&startDate=2024-01-01&endDate=2024-01-31
 */
export const getCheckinList = async (req, res, next) => {
    try {
        const { hospitalId, startDate, endDate } = req.query;

        const result = await SuperAdminService.getCheckinList(hospitalId || null, {
            startDate,
            endDate
        });

        logInfo('Check-in list retrieved via API', {
            level: result.level,
            hospitalId: result.hospitalId,
            count: result.totalCount
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Check-in appointments retrieved successfully',
            data: result
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/appointments/checkins',
            query: req.query
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve check-in appointments'
        ));
    }
};

/**
 * Get Check-out Appointments List
 * GET /api/super-admin/appointments/checkouts?hospitalId=H0001&startDate=2024-01-01&endDate=2024-01-31
 */
export const getCheckoutList = async (req, res, next) => {
    try {
        const { hospitalId, startDate, endDate } = req.query;

        const result = await SuperAdminService.getCheckoutList(hospitalId || null, {
            startDate,
            endDate
        });

        logInfo('Check-out list retrieved via API', {
            level: result.level,
            hospitalId: result.hospitalId,
            count: result.totalCount
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Check-out appointments retrieved successfully',
            data: result
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/appointments/checkouts',
            query: req.query
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve check-out appointments'
        ));
    }
};

/**
 * Get Not Arrived Appointments List
 * GET /api/super-admin/appointments/not-arrived?hospitalId=H0001&startDate=2024-01-01&endDate=2024-01-31
 */
export const getNotArrivedList = async (req, res, next) => {
    try {
        const { hospitalId, startDate, endDate } = req.query;

        const result = await SuperAdminService.getNotArrivedList(hospitalId || null, {
            startDate,
            endDate
        });

        logInfo('Not arrived list retrieved via API', {
            level: result.level,
            hospitalId: result.hospitalId,
            count: result.totalCount
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Not arrived appointments retrieved successfully',
            data: result
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/appointments/not-arrived',
            query: req.query
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve not arrived appointments'
        ));
    }
};

/**
 * Send Notification to All Patients
 * POST /api/super-admin/notifications/send
 */
export const sendNotificationToAllPatients = async (req, res, next) => {
    try {
        const { title, body, data, superAdminId } = req.body;

        if (!superAdminId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'superAdminId is required'
            );
        }

        if (!title || !body) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Title and body are required'
            );
        }

        const result = await SuperAdminService.sendNotificationToAllPatients(
            { title, body, data },
            superAdminId
        );

        logInfo('Notification sent to all patients via API', {
            superAdminId,
            notificationId: result.notificationId,
            totalRecipients: result.totalRecipients,
            successfulCount: result.successfulCount
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Notification sent to all patients successfully',
            data: result
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/notifications/send',
            superAdminId: req.body?.superAdminId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to send notification'
        ));
    }
};

/**
 * Get All Notifications History
 * GET /api/super-admin/notifications?page=1&limit=10&superAdminId=SA0001
 */
export const getAllNotifications = async (req, res, next) => {
    try {
        const { page, limit, superAdminId } = req.query;

        const result = await SuperAdminService.getAllNotifications({
            page,
            limit,
            superAdminId
        });

        logInfo('Notification history retrieved via API', {
            page: result.pagination.currentPage,
            limit: result.pagination.limit,
            totalCount: result.pagination.totalCount,
            superAdminId: superAdminId || 'all'
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Notification history retrieved successfully',
            data: result
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/super-admin/notifications',
            query: req.query
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve notification history'
        ));
    }
};