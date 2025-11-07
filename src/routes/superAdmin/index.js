import express from 'express';
import { signup, login, getAllAdmins, holdAdmin, approveAdmin, rejectAdmin, getAllUsers, getUserAppointments, getAppointmentsByHospital, getDocumentsByHospital, getFollowupsByHospital, getFollowupList, getCheckinList, getCheckoutList, getNotArrivedList, sendNotificationToAllPatients, getAllNotifications } from '../../controller/superAdminController.js';
import { orchestratorRateLimit } from '../../notificationOrchestrator/middleware/rateLimit.js';

const router = express.Router();

/**
 * @swagger
 * /api/super-admin/auth/signup:
 *   post:
 *     summary: Super Admin Signup
 *     description: Create a new super admin account
 *     tags: [Super Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "superadmin"
 *               email:
 *                 type: string
 *                 example: "admin@easyq.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Super admin created successfully
 */
router.post('/auth/signup', orchestratorRateLimit, signup);

/**
 * @swagger
 * /api/super-admin/auth/login:
 *   post:
 *     summary: Super Admin Login
 *     description: Login super admin and get JWT token
 *     tags: [Super Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "superadmin"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/auth/login', orchestratorRateLimit, login);

/**
 * @swagger
 * /api/super-admin/admins:
 *   get:
 *     summary: Get All Admins
 *     description: Retrieve all admins or filter by status
 *     tags: [Super Admin - Admin Management]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, on_hold]
 *         example: "pending"
 *         description: Filter admins by status
 *     responses:
 *       200:
 *         description: Admins retrieved successfully
 */
router.get('/admins', orchestratorRateLimit, getAllAdmins);

/**
 * @swagger
 * /api/super-admin/admins/{adminId}/hold:
 *   put:
 *     summary: Hold Admin
 *     description: Put an admin on hold with reason
 *     tags: [Super Admin - Admin Management]
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         example: "A0001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - holdReason
 *               - holdBy
 *             properties:
 *               holdReason:
 *                 type: string
 *                 example: "Missing documentation"
 *               holdBy:
 *                 type: string
 *                 example: "SA0001"
 *               canBeApprovedLater:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Admin put on hold successfully
 */
router.put('/admins/:adminId/hold', orchestratorRateLimit, holdAdmin);

/**
 * @swagger
 * /api/super-admin/admins/{adminId}/approve:
 *   put:
 *     summary: Approve Admin
 *     description: Approve an admin account
 *     tags: [Super Admin - Admin Management]
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         example: "A0001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approvedBy
 *             properties:
 *               approvedBy:
 *                 type: string
 *                 example: "SA0001"
 *     responses:
 *       200:
 *         description: Admin approved successfully
 */
router.put('/admins/:adminId/approve', orchestratorRateLimit, approveAdmin);

/**
 * @swagger
 * /api/super-admin/admins/{adminId}/reject:
 *   put:
 *     summary: Reject Admin
 *     description: Reject an admin account
 *     tags: [Super Admin - Admin Management]
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         example: "A0001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectedBy
 *             properties:
 *               rejectedBy:
 *                 type: string
 *                 example: "SA0001"
 *               reason:
 *                 type: string
 *                 example: "Incomplete documentation"
 *     responses:
 *       200:
 *         description: Admin rejected successfully
 */
router.put('/admins/:adminId/reject', orchestratorRateLimit, rejectAdmin);

/**
 * @swagger
 * /api/super-admin/users:
 *   get:
 *     summary: Get All Users
 *     description: Retrieve all users with pagination
 *     tags: [Super Admin - User Management]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', orchestratorRateLimit, getAllUsers);

/**
 * @swagger
 * /api/super-admin/users/{userId}/appointments:
 *   get:
 *     summary: Get User Appointments History
 *     description: Retrieve user's appointment history with optional filters
 *     tags: [Super Admin - User Management]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: "P0001"
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Filter by specific date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         example: "Completed"
 *         description: Filter by appointment status (comma-separated for multiple)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: User appointments retrieved successfully
 */
router.get('/users/:userId/appointments', orchestratorRateLimit, getUserAppointments);

/**
 * @swagger
 * /api/super-admin/hospitals/{hospitalId}/appointments:
 *   get:
 *     summary: Get All Appointments by Hospital
 *     description: Retrieve all appointments for a specific hospital with optional filters
 *     tags: [Super Admin - Hospital Management]
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         example: "H0001"
 *         description: Hospital ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Filter by specific date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         example: "Completed"
 *         description: Filter by appointment status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: Hospital appointments retrieved successfully
 */
router.get('/hospitals/:hospitalId/appointments', orchestratorRateLimit, getAppointmentsByHospital);

/**
 * @swagger
 * /api/super-admin/hospitals/{hospitalId}/documents:
 *   get:
 *     summary: Get All Documents by Hospital
 *     description: Retrieve all patient documents for a specific hospital
 *     tags: [Super Admin - Hospital Management]
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         example: "H0001"
 *         description: Hospital ID
 *     responses:
 *       200:
 *         description: Hospital documents retrieved successfully
 */
router.get('/hospitals/:hospitalId/documents', orchestratorRateLimit, getDocumentsByHospital);

/**
 * @swagger
 * /api/super-admin/hospitals/{hospitalId}/followups:
 *   get:
 *     summary: Get All Followups by Hospital
 *     description: Retrieve all followup appointments for a specific hospital
 *     tags: [Super Admin - Hospital Management]
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         example: "H0001"
 *         description: Hospital ID
 *     responses:
 *       200:
 *         description: Hospital followups retrieved successfully
 */
router.get('/hospitals/:hospitalId/followups', orchestratorRateLimit, getFollowupsByHospital);

/**
 * @swagger
 * /api/super-admin/appointments/followups:
 *   get:
 *     summary: Get Follow-up Appointments List
 *     description: Retrieve all follow-up appointments (Open API - no authentication required)
 *     tags: [Super Admin - Appointment Lists]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         example: "H0001"
 *         description: Hospital ID (optional - omit for overall level)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: Follow-up appointments retrieved successfully
 */
router.get('/appointments/followups', getFollowupList);

/**
 * @swagger
 * /api/super-admin/appointments/checkins:
 *   get:
 *     summary: Get Check-in Appointments List
 *     description: Retrieve all check-in appointments (Open API - no authentication required)
 *     tags: [Super Admin - Appointment Lists]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         example: "H0001"
 *         description: Hospital ID (optional - omit for overall level)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: Check-in appointments retrieved successfully
 */
router.get('/appointments/checkins', getCheckinList);

/**
 * @swagger
 * /api/super-admin/appointments/checkouts:
 *   get:
 *     summary: Get Check-out Appointments List
 *     description: Retrieve all check-out appointments (Open API - no authentication required)
 *     tags: [Super Admin - Appointment Lists]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         example: "H0001"
 *         description: Hospital ID (optional - omit for overall level)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: Check-out appointments retrieved successfully
 */
router.get('/appointments/checkouts', getCheckoutList);

/**
 * @swagger
 * /api/super-admin/appointments/not-arrived:
 *   get:
 *     summary: Get Not Arrived Appointments List
 *     description: Retrieve all not arrived appointments (Open API - no authentication required)
 *     tags: [Super Admin - Appointment Lists]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         example: "H0001"
 *         description: Hospital ID (optional - omit for overall level)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *         description: End date for date range filter
 *     responses:
 *       200:
 *         description: Not arrived appointments retrieved successfully
 */
router.get('/appointments/not-arrived', getNotArrivedList);

/**
 * @swagger
 * /api/super-admin/notifications/send:
 *   post:
 *     summary: Send Notification to All Patients
 *     description: Send a common notification to all active patients (Open API - no authentication required)
 *     tags: [Super Admin - Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - superAdminId
 *               - title
 *               - body
 *             properties:
 *               superAdminId:
 *                 type: string
 *                 example: "SA0001"
 *                 description: Super Admin ID
 *               title:
 *                 type: string
 *                 example: "Important Announcement"
 *                 description: Notification title
 *               body:
 *                 type: string
 *                 example: "This is an important message for all patients."
 *                 description: Notification body/message
 *               data:
 *                 type: object
 *                 example: { "action": "view", "url": "https://example.com" }
 *                 description: Additional data to send with notification
 *     responses:
 *       200:
 *         description: Notification sent successfully
 */
router.post('/notifications/send', sendNotificationToAllPatients);

/**
 * @swagger
 * /api/super-admin/notifications:
 *   get:
 *     summary: Get All Notifications History
 *     description: Retrieve all notifications sent by super admins (Open API - no authentication required)
 *     tags: [Super Admin - Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         example: 10
 *         description: Number of notifications per page
 *       - in: query
 *         name: superAdminId
 *         schema:
 *           type: string
 *         example: "SA0001"
 *         description: Filter by super admin ID (optional)
 *     responses:
 *       200:
 *         description: Notification history retrieved successfully
 */
router.get('/notifications', getAllNotifications);

export default router;
