import SuperAdmin from '../model/superAdmin.js';
import AdminProfile from '../model/adminProfile.js';
import User from '../model/userProfile.js';
import Appointment from '../model/appointment.js';
import Hospital from '../model/hospital.js';
import FCMToken from '../model/fcmToken.js';
import NotificationHistory from '../model/notificationHistory.js';
import admin from '../config/firebaseAdmin.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';
import { generateToken } from '../util/tokenGenerator.js';

export class SuperAdminService {

    /**
     * Signup a new super admin
     * @param {Object} signupData - Super admin signup data
     * @returns {Object} Created super admin
     */
    static async signup(signupData) {
        try {
            const { username, email, password } = signupData;

            // Validate required fields
            if (!username || !email || !password) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Username, email, and password are required'
                );
            }

            // Check if username already exists
            const existingUsername = await SuperAdmin.findByUsername(username);
            if (existingUsername) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Username already exists'
                );
            }

            // Check if email already exists
            const existingEmail = await SuperAdmin.findByEmail(email);
            if (existingEmail) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Email already exists'
                );
            }

            // Create super admin
            const newSuperAdmin = await SuperAdmin.create({
                username,
                email,
                password
            });

            logInfo('Super admin created', {
                superAdminId: newSuperAdmin.superAdminId,
                username: newSuperAdmin.username,
                email: newSuperAdmin.email
            });

            // Return without password
            const { password: _, ...superAdminWithoutPassword } = newSuperAdmin.toObject();
            return superAdminWithoutPassword;

        } catch (error) {
            logError('Error creating super admin', {
                error: error.message,
                signupData: { username: signupData?.username, email: signupData?.email }
            });
            throw error;
        }
    }

    /**
     * Login super admin
     * @param {Object} loginData - Login credentials
     * @returns {Object} Login response with token
     */
    static async login(loginData) {
        try {
            const { username, password } = loginData;

            // Validate required fields
            if (!username || !password) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Username and password are required'
                );
            }

            // Find super admin by username
            const superAdmin = await SuperAdmin.findByUsername(username);
            if (!superAdmin) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Invalid username or password'
                );
            }

            // Check if account is active
            if (!superAdmin.isActive) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Account is deactivated'
                );
            }

            // Verify password
            const isPasswordValid = await superAdmin.comparePassword(password);
            if (!isPasswordValid) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Invalid username or password'
                );
            }

            // Update last login
            await superAdmin.updateLastLogin();

            // Generate JWT token
            const token = generateToken({
                superAdminId: superAdmin.superAdminId,
                username: superAdmin.username,
                email: superAdmin.email
            });

            logInfo('Super admin login successful', {
                superAdminId: superAdmin.superAdminId,
                username: superAdmin.username
            });

            // Return without password
            const { password: _, ...superAdminWithoutPassword } = superAdmin.toObject();
            return {
                superAdmin: superAdminWithoutPassword,
                token
            };

        } catch (error) {
            logError('Error during super admin login', {
                error: error.message,
                username: loginData?.username
            });
            throw error;
        }
    }

    /**
     * Get all admins
     * @param {string} status - Optional status filter
     * @returns {Array} List of admins
     */
    static async getAllAdmins(status = null) {
        try {
            let query = {};
            
            if (status) {
                if (status === 'pending') {
                    query.verificationStatus = 'Pending';
                } else {
                    query.verificationStatus = status;
                }
            }

            const admins = await AdminProfile.find(query)
                .sort({ createdAt: -1 })
                .lean();

            logInfo('Admins retrieved', {
                status: status || 'all',
                count: admins.length
            });

            return admins;

        } catch (error) {
            logError('Error getting admins', {
                error: error.message,
                status
            });
            throw error;
        }
    }

    /**
     * Hold an admin
     * @param {string} adminId - Admin ID
     * @param {Object} holdData - Hold information
     * @returns {Object} Updated admin
     */
    static async holdAdmin(adminId, holdData) {
        try {
            const { holdReason, holdBy, canBeApprovedLater = true } = holdData;

            // Validate required fields
            if (!holdReason || !holdBy) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Hold reason and holdBy are required'
                );
            }

            // Find admin
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Admin ${adminId} not found`
                );
            }

            // Update admin status and hold info
            admin.verificationStatus = 'On Hold';
            admin.holdInfo = {
                holdReason,
                holdDate: new Date(),
                holdBy,
                canBeApprovedLater
            };

            await admin.save();

            logInfo('Admin put on hold', {
                adminId,
                holdReason,
                holdBy,
                canBeApprovedLater
            });

            return admin;

        } catch (error) {
            logError('Error holding admin', {
                error: error.message,
                adminId,
                holdData
            });
            throw error;
        }
    }

    /**
     * Approve an admin
     * @param {string} adminId - Admin ID
     * @param {string} approvedBy - Super admin ID who approved
     * @returns {Object} Updated admin
     */
    static async approveAdmin(adminId, approvedBy) {
        try {
            // Find admin
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Admin ${adminId} not found`
                );
            }

            // Update admin status
            admin.verificationStatus = 'Approved';
            admin.isActive = true;
            
            // Clear hold info if exists
            if (admin.holdInfo) {
                admin.holdInfo = undefined;
            }

            await admin.save();

            logInfo('Admin approved', {
                adminId,
                approvedBy
            });

            return admin;

        } catch (error) {
            logError('Error approving admin', {
                error: error.message,
                adminId,
                approvedBy
            });
            throw error;
        }
    }

    /**
     * Reject an admin
     * @param {string} adminId - Admin ID
     * @param {string} rejectedBy - Super admin ID who rejected
     * @param {string} reason - Rejection reason
     * @returns {Object} Updated admin
     */
    static async rejectAdmin(adminId, rejectedBy, reason = null) {
        try {
            // Find admin
            const admin = await AdminProfile.findOne({ adminId });
            if (!admin) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Admin ${adminId} not found`
                );
            }

            // Update admin status
            admin.verificationStatus = 'Rejected';
            admin.isActive = false;
            
            // Clear hold info if exists
            if (admin.holdInfo) {
                admin.holdInfo = undefined;
            }

            await admin.save();

            logInfo('Admin rejected', {
                adminId,
                rejectedBy,
                reason
            });

            return admin;

        } catch (error) {
            logError('Error rejecting admin', {
                error: error.message,
                adminId,
                rejectedBy
            });
            throw error;
        }
    }

    /**
     * Get all users with pagination
     * @param {Object} paginationData - Pagination parameters
     * @returns {Object} Users with pagination info
     */
    static async getAllUsers(paginationData) {
        try {
            const { page = 1, limit = 10 } = paginationData;
            const skip = (page - 1) * limit;

            // Query for users only (not admins or doctors)
            const query = { role: 'user' };

            const [users, totalCount] = await Promise.all([
                User.find(query)
                    .select('-password') // Exclude password
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                User.countDocuments(query)
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            logInfo('Users retrieved', {
                page,
                limit,
                totalCount,
                totalPages
            });

            return {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    limit: parseInt(limit),
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };

        } catch (error) {
            logError('Error getting users', {
                error: error.message,
                paginationData
            });
            throw error;
        }
    }

    /**
     * Get user appointments history
     * @param {string} userId - User ID
     * @param {Object} filterData - Filter parameters
     * @returns {Array} User appointments
     */
    static async getUserAppointments(userId, filterData = {}) {
        try {
            const { date, status, startDate, endDate } = filterData;

            // Build query
            let query = { patientId: userId };

            // Date filter
            if (date) {
                const targetDate = new Date(date);
                targetDate.setHours(0, 0, 0, 0);
                const nextDay = new Date(targetDate);
                nextDay.setDate(nextDay.getDate() + 1);
                
                query.appointmentDate = {
                    $gte: targetDate,
                    $lt: nextDay
                };
            }

            // Date range filter
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                
                query.appointmentDate = {
                    $gte: start,
                    $lte: end
                };
            }

            // Status filter
            if (status) {
                if (typeof status === 'string') {
                    // Handle comma-separated statuses
                    const statuses = status.split(',').map(s => s.trim());
                    query.status = { $in: statuses };
                } else {
                    query.status = status;
                }
            }

            const appointments = await Appointment.find(query)
                .sort({ appointmentDate: -1, appointmentTime: -1 })
                .lean();

            logInfo('User appointments retrieved', {
                userId,
                filterData,
                count: appointments.length
            });

            return appointments;

        } catch (error) {
            logError('Error getting user appointments', {
                error: error.message,
                userId,
                filterData
            });
            throw error;
        }
    }

    /**
     * Get all appointments by hospital
     * @param {string} hospitalId - Hospital ID
     * @param {Object} filterData - Filter options
     * @returns {Object} Appointments with hospital info
     */
    static async getAppointmentsByHospital(hospitalId, filterData = {}) {
        try {
            const { date, status, startDate, endDate } = filterData;

            // Fetch hospital to get name
            const hospital = await Hospital.findOne({ hospitalId }).select('name').lean();
            const hospitalName = hospital ? hospital.name : 'Unknown Hospital';

            // Build query
            const query = { hospitalId };

            // Add date filters
            if (date) {
                const targetDate = new Date(date);
                const nextDay = new Date(targetDate);
                nextDay.setDate(nextDay.getDate() + 1);
                
                query.appointmentDate = {
                    $gte: targetDate,
                    $lt: nextDay
                };
            } else if (startDate && endDate) {
                query.appointmentDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            // Add status filter
            if (status) {
                query.status = status;
            }

            const appointments = await Appointment.find(query)
                .sort({ appointmentDate: -1, appointmentTime: -1 })
                .lean();

            logInfo('Appointments retrieved by hospital', {
                hospitalId,
                hospitalName,
                count: appointments.length,
                filterData
            });

            return {
                hospitalId,
                hospitalName,
                appointments
            };

        } catch (error) {
            logError('Error getting appointments by hospital', {
                error: error.message,
                hospitalId,
                filterData
            });
            throw error;
        }
    }

    /**
     * Get all documents by hospital (patients and their documents)
     * @param {string} hospitalId - Hospital ID
     * @returns {Object} Patients with their documents and hospital info
     */
    static async getDocumentsByHospital(hospitalId) {
        try {
            // Fetch hospital to get name
            const hospital = await Hospital.findOne({ hospitalId }).select('name').lean();
            const hospitalName = hospital ? hospital.name : 'Unknown Hospital';

            // Get all appointments for the hospital that have documents
            const appointments = await Appointment.find({
                hospitalId,
                reportUrls: { $exists: true, $not: { $size: 0 } }
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .lean();

            if (!appointments || appointments.length === 0) {
                return {
                    hospitalId,
                    hospitalName,
                    patientsWithDocuments: []
                };
            }

            // Group by patient
            const patientDocuments = {};
            
            appointments.forEach(appointment => {
                const patientId = appointment.patientId;
                
                if (!patientDocuments[patientId]) {
                    patientDocuments[patientId] = {
                        patientId,
                        patientName: appointment.patientName || 'Unknown',
                        totalDocuments: 0,
                        appointments: []
                    };
                }

                const documents = (appointment.reportUrls || []).map((url, index) => ({
                    documentId: `${appointment.appointmentId}_${index + 1}`,
                    documentUrl: url,
                    appointmentId: appointment.appointmentId,
                    appointmentDate: appointment.appointmentDate,
                    doctorName: appointment.doctorName
                }));

                patientDocuments[patientId].appointments.push({
                    appointmentId: appointment.appointmentId,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    doctorName: appointment.doctorName,
                    status: appointment.status,
                    documents
                });

                patientDocuments[patientId].totalDocuments += documents.length;
            });

            const result = Object.values(patientDocuments);

            logInfo('Documents retrieved by hospital', {
                hospitalId,
                hospitalName,
                patientsCount: result.length,
                totalAppointments: appointments.length
            });

            return {
                hospitalId,
                hospitalName,
                patientsWithDocuments: result
            };

        } catch (error) {
            logError('Error getting documents by hospital', {
                error: error.message,
                hospitalId
            });
            throw error;
        }
    }

    /**
     * Get all followups by hospital (patients with followups)
     * @param {string} hospitalId - Hospital ID
     * @returns {Object} Patients with followup appointments and hospital info
     */
    static async getFollowupsByHospital(hospitalId) {
        try {
            // Fetch hospital to get name
            const hospital = await Hospital.findOne({ hospitalId }).select('name').lean();
            const hospitalName = hospital ? hospital.name : 'Unknown Hospital';

            // Get all followup appointments for the hospital
            const followupAppointments = await Appointment.find({
                hospitalId,
                'followUp.isFollowUp': true
            })
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .lean();

            if (!followupAppointments || followupAppointments.length === 0) {
                return {
                    hospitalId,
                    hospitalName,
                    patientsWithFollowups: []
                };
            }

            // Group by patient
            const patientFollowups = {};
            
            followupAppointments.forEach(appointment => {
                const patientId = appointment.patientId;
                
                if (!patientFollowups[patientId]) {
                    patientFollowups[patientId] = {
                        patientId,
                        patientName: appointment.patientName || 'Unknown',
                        totalFollowups: 0,
                        followups: []
                    };
                }

                patientFollowups[patientId].followups.push({
                    appointmentId: appointment.appointmentId,
                    appointmentDate: appointment.appointmentDate,
                    appointmentTime: appointment.appointmentTime,
                    doctorName: appointment.doctorName,
                    status: appointment.status,
                    followUpReason: appointment.followUp?.followUpReason,
                    parentAppointmentId: appointment.followUp?.parentAppointmentId,
                    createdBy: appointment.followUp?.createdBy,
                    createdById: appointment.followUp?.createdById
                });

                patientFollowups[patientId].totalFollowups += 1;
            });

            const result = Object.values(patientFollowups);

            logInfo('Followups retrieved by hospital', {
                hospitalId,
                hospitalName,
                patientsCount: result.length,
                totalFollowups: followupAppointments.length
            });

            return {
                hospitalId,
                hospitalName,
                patientsWithFollowups: result
            };

        } catch (error) {
            logError('Error getting followups by hospital', {
                error: error.message,
                hospitalId
            });
            throw error;
        }
    }

    /**
     * Get follow-up appointments list
     * @param {string|null} hospitalId - Hospital ID (optional, null for overall)
     * @param {Object} filterData - Filter options (startDate, endDate)
     * @returns {Object} Follow-up appointments with hospital info
     */
    static async getFollowupList(hospitalId = null, filterData = {}) {
        try {
            const { startDate, endDate } = filterData;

            // Build query
            const query = {
                'followUp.isFollowUp': true
            };

            // Add hospital filter if provided
            if (hospitalId) {
                query.hospitalId = hospitalId;
            }

            // Add date range filter
            if (startDate && endDate) {
                query.appointmentDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const appointments = await Appointment.find(query)
                .sort({ appointmentDate: -1, appointmentTime: -1 })
                .lean();

            // Get hospital names if hospital level
            let hospitalName = null;
            if (hospitalId) {
                const hospital = await Hospital.findOne({ hospitalId }).select('name').lean();
                hospitalName = hospital ? hospital.name : 'Unknown Hospital';
            }

            logInfo('Follow-up appointments retrieved', {
                hospitalId: hospitalId || 'all',
                hospitalName,
                count: appointments.length,
                filterData
            });

            return {
                level: hospitalId ? 'hospital' : 'overall',
                hospitalId: hospitalId || null,
                hospitalName,
                appointments,
                totalCount: appointments.length,
                filters: { startDate, endDate }
            };

        } catch (error) {
            logError('Error getting follow-up list', {
                error: error.message,
                hospitalId,
                filterData
            });
            throw error;
        }
    }

    /**
     * Get check-in appointments list
     * @param {string|null} hospitalId - Hospital ID (optional, null for overall)
     * @param {Object} filterData - Filter options (startDate, endDate)
     * @returns {Object} Check-in appointments with hospital info
     */
    static async getCheckinList(hospitalId = null, filterData = {}) {
        try {
            const { startDate, endDate } = filterData;

            // Build query - check-in means checked in but not checked out
            const query = {
                $or: [
                    { checkInStatus: 'Checked-in' },
                    { isCheckedIn: true },
                    { checkInTime: { $ne: null } }
                ],
                $and: [
                    { checkOutTime: null },
                    { checkInStatus: { $ne: 'Checked-out' } }
                ]
            };

            // Add hospital filter if provided
            if (hospitalId) {
                query.hospitalId = hospitalId;
            }

            // Add date range filter
            if (startDate && endDate) {
                query.appointmentDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const appointments = await Appointment.find(query)
                .sort({ checkInTime: -1, appointmentDate: -1 })
                .lean();

            // Get hospital names if hospital level
            let hospitalName = null;
            if (hospitalId) {
                const hospital = await Hospital.findOne({ hospitalId }).select('name').lean();
                hospitalName = hospital ? hospital.name : 'Unknown Hospital';
            }

            logInfo('Check-in appointments retrieved', {
                hospitalId: hospitalId || 'all',
                hospitalName,
                count: appointments.length,
                filterData
            });

            return {
                level: hospitalId ? 'hospital' : 'overall',
                hospitalId: hospitalId || null,
                hospitalName,
                appointments,
                totalCount: appointments.length,
                filters: { startDate, endDate }
            };

        } catch (error) {
            logError('Error getting check-in list', {
                error: error.message,
                hospitalId,
                filterData
            });
            throw error;
        }
    }

    /**
     * Get check-out appointments list
     * @param {string|null} hospitalId - Hospital ID (optional, null for overall)
     * @param {Object} filterData - Filter options (startDate, endDate)
     * @returns {Object} Check-out appointments with hospital info
     */
    static async getCheckoutList(hospitalId = null, filterData = {}) {
        try {
            const { startDate, endDate } = filterData;

            // Build query - check-out means checked out
            const query = {
                $or: [
                    { checkInStatus: 'Checked-out' },
                    { checkOutTime: { $ne: null } }
                ]
            };

            // Add hospital filter if provided
            if (hospitalId) {
                query.hospitalId = hospitalId;
            }

            // Add date range filter
            if (startDate && endDate) {
                query.appointmentDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const appointments = await Appointment.find(query)
                .sort({ checkOutTime: -1, appointmentDate: -1 })
                .lean();

            // Get hospital names if hospital level
            let hospitalName = null;
            if (hospitalId) {
                const hospital = await Hospital.findOne({ hospitalId }).select('name').lean();
                hospitalName = hospital ? hospital.name : 'Unknown Hospital';
            }

            logInfo('Check-out appointments retrieved', {
                hospitalId: hospitalId || 'all',
                hospitalName,
                count: appointments.length,
                filterData
            });

            return {
                level: hospitalId ? 'hospital' : 'overall',
                hospitalId: hospitalId || null,
                hospitalName,
                appointments,
                totalCount: appointments.length,
                filters: { startDate, endDate }
            };

        } catch (error) {
            logError('Error getting check-out list', {
                error: error.message,
                hospitalId,
                filterData
            });
            throw error;
        }
    }

    /**
     * Get not arrived appointments list
     * @param {string|null} hospitalId - Hospital ID (optional, null for overall)
     * @param {Object} filterData - Filter options (startDate, endDate)
     * @returns {Object} Not arrived appointments with hospital info
     */
    static async getNotArrivedList(hospitalId = null, filterData = {}) {
        try {
            const { startDate, endDate } = filterData;
            const now = new Date();

            // Build query - not arrived means not checked in and appointment time has passed
            const query = {
                $or: [
                    { checkInStatus: 'Not Checked-in' },
                    { 
                        checkInStatus: { $exists: false },
                        checkInTime: null,
                        isCheckedIn: { $ne: true }
                    }
                ],
                $and: [
                    { checkOutTime: null }
                ]
            };

            // Add hospital filter if provided
            if (hospitalId) {
                query.hospitalId = hospitalId;
            }

            // Add date range filter
            if (startDate && endDate) {
                query.appointmentDate = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            } else {
                // If no date range, only show appointments that have passed
                query.appointmentDate = { $lt: now };
            }

            const appointments = await Appointment.find(query)
                .sort({ appointmentDate: -1, appointmentTime: -1 })
                .lean();

            // Filter appointments where appointment time has passed
            const filteredAppointments = appointments.filter(apt => {
                if (!apt.appointmentDate || !apt.appointmentTime) return false;
                
                const appointmentDateTime = new Date(apt.appointmentDate);
                const [hours, minutes] = apt.appointmentTime.split(':').map(Number);
                appointmentDateTime.setHours(hours, minutes, 0, 0);
                
                return appointmentDateTime < now;
            });

            // Get hospital names if hospital level
            let hospitalName = null;
            if (hospitalId) {
                const hospital = await Hospital.findOne({ hospitalId }).select('name').lean();
                hospitalName = hospital ? hospital.name : 'Unknown Hospital';
            }

            logInfo('Not arrived appointments retrieved', {
                hospitalId: hospitalId || 'all',
                hospitalName,
                count: filteredAppointments.length,
                filterData
            });

            return {
                level: hospitalId ? 'hospital' : 'overall',
                hospitalId: hospitalId || null,
                hospitalName,
                appointments: filteredAppointments,
                totalCount: filteredAppointments.length,
                filters: { startDate, endDate }
            };

        } catch (error) {
            logError('Error getting not arrived list', {
                error: error.message,
                hospitalId,
                filterData
            });
            throw error;
        }
    }

    /**
     * Send notification to all patients
     * @param {Object} notificationData - Notification data (title, body, data)
     * @param {string} superAdminId - Super Admin ID
     * @returns {Object} Notification result
     */
    static async sendNotificationToAllPatients(notificationData, superAdminId) {
        try {
            const { title, body, data = {} } = notificationData;

            // Validate required fields
            if (!title || !body) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Title and body are required'
                );
            }

            // Get super admin details
            const superAdmin = await SuperAdmin.findOne({ superAdminId }).select('username').lean();
            const superAdminName = superAdmin ? superAdmin.username : null;

            // Create notification history record
            const notificationHistory = new NotificationHistory({
                title,
                body,
                data: data || {},
                sentBy: {
                    superAdminId,
                    superAdminName
                },
                recipientType: 'all_patients',
                status: 'sending'
            });
            await notificationHistory.save();

            // Get all active patients (users with role='user')
            const patients = await User.find({ 
                role: 'user',
                isActive: true 
            }).select('userId').lean();

            let successfulCount = 0;
            let failedCount = 0;
            const totalRecipients = patients.length;

            // Get all active FCM tokens for all patients
            const allTokens = await FCMToken.find({ 
                userId: { $in: patients.map(p => p.userId) },
                isActive: true 
            }).lean();

            logInfo('Sending notification to all patients', {
                superAdminId,
                superAdminName,
                totalPatients: totalRecipients,
                totalTokens: allTokens.length
            });

            // Send notifications to all tokens
            const sendPromises = allTokens.map(async (tokenDoc) => {
                try {
                    const message = {
                        token: tokenDoc.fcmToken,
                        notification: {
                            title,
                            body
                        },
                        data: {
                            type: 'super_admin_broadcast',
                            ...Object.fromEntries(
                                Object.entries(data).map(([k, v]) => [k, String(v)])
                            )
                        }
                    };

                    await admin.messaging().send(message);
                    successfulCount++;
                    
                    // Update token last used
                    await FCMToken.updateOne(
                        { _id: tokenDoc._id },
                        { lastUsed: new Date() }
                    );
                } catch (tokenError) {
                    failedCount++;
                    
                    // Handle invalid tokens
                    if (tokenError.code && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(tokenError.code)) {
                        await FCMToken.updateOne(
                            { _id: tokenDoc._id },
                            { isActive: false }
                        );
                        logInfo('Deactivated invalid FCM token', {
                            tokenId: tokenDoc._id,
                            userId: tokenDoc.userId
                        });
                    } else {
                        logError('Failed to send notification to token', {
                            tokenId: tokenDoc._id,
                            userId: tokenDoc.userId,
                            error: tokenError.message
                        });
                    }
                }
            });

            await Promise.all(sendPromises);

            // Update notification history
            notificationHistory.status = 'completed';
            notificationHistory.recipientCount = totalRecipients;
            notificationHistory.successfulCount = successfulCount;
            notificationHistory.failedCount = failedCount;
            notificationHistory.completedAt = new Date();
            await notificationHistory.save();

            logInfo('Notification sent to all patients', {
                superAdminId,
                superAdminName,
                totalRecipients,
                successfulCount,
                failedCount,
                notificationId: notificationHistory._id
            });

            return {
                notificationId: notificationHistory._id,
                totalRecipients,
                successfulCount,
                failedCount,
                status: 'completed'
            };

        } catch (error) {
            logError('Error sending notification to all patients', {
                error: error.message,
                superAdminId,
                notificationData
            });
            throw error;
        }
    }

    /**
     * Get all notification history
     * @param {Object} filterData - Filter options (page, limit, superAdminId)
     * @returns {Object} Notification history with pagination
     */
    static async getAllNotifications(filterData = {}) {
        try {
            const { page = 1, limit = 10, superAdminId } = filterData;
            const skip = (page - 1) * limit;

            // Build query
            const query = {};
            if (superAdminId) {
                query['sentBy.superAdminId'] = superAdminId;
            }

            const [notifications, totalCount] = await Promise.all([
                NotificationHistory.find(query)
                    .sort({ sentAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .lean(),
                NotificationHistory.countDocuments(query)
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            logInfo('Notification history retrieved', {
                page,
                limit,
                totalCount,
                totalPages,
                superAdminId: superAdminId || 'all'
            });

            return {
                notifications,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    limit: parseInt(limit),
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            };

        } catch (error) {
            logError('Error getting notification history', {
                error: error.message,
                filterData
            });
            throw error;
        }
    }
}
