import SuperAdmin from '../model/superAdmin.js';
import AdminProfile from '../model/adminProfile.js';
import User from '../model/userProfile.js';
import Appointment from '../model/appointment.js';
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
}
