import Doctor from '../model/doctor.js';
import Nurse from '../model/nurse.js';
import Hospital from '../model/hospital.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';

export class CommonAuthService {
    
    static async signup(signupData) {
        try {
            const { email, password, confirmPassword } = signupData;

            // Validate required fields
            if (!email || !password || !confirmPassword) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Email, password, and confirm password are required.'
                );
            }

            // Validate password confirmation
            if (password !== confirmPassword) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Password and confirm password do not match.'
                );
            }

            // Validate password strength
            if (password.length < 6) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Password must be at least 6 characters long.'
                );
            }

            // Search in both Doctor and Nurse collections
            const [doctor, nurse] = await Promise.all([
                Doctor.findOne({ email: email.toLowerCase() }),
                Nurse.findOne({ email: email.toLowerCase() })
            ]);

            if (!doctor && !nurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User not found with this email address. Please contact your administrator.'
                );
            }

            // Determine user type and check if password is already set
            let user, userType, userId;
            if (doctor) {
                if (doctor.isPasswordSet) {
                    throw new EasyQError(
                        'ConflictError',
                        httpStatusCode.CONFLICT,
                        true,
                        'Password is already set for this doctor account.'
                    );
                }
                user = doctor;
                userType = 'doctor';
                userId = doctor.doctorId;
            } else {
                if (nurse.isPasswordSet) {
                    throw new EasyQError(
                        'ConflictError',
                        httpStatusCode.CONFLICT,
                        true,
                        'Password is already set for this nurse account.'
                    );
                }
                user = nurse;
                userType = 'nurse';
                userId = nurse.nurseId;
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Update user with password
            user.password = hashedPassword;
            user.isPasswordSet = true;
            await user.save();

            logInfo('User password set successfully', {
                userId: userId,
                userType: userType,
                email: user.email
            });

            return {
                success: true,
                message: 'Account activated successfully',
                data: {
                    userId: userId,
                    userType: userType,
                    email: user.email
                }
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            logError('Common signup error', {
                error: error.message,
                stack: error.stack,
                email: signupData?.email
            });
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to activate account.'
            );
        }
    }

    static async login(loginData) {
        try {
            const { email, password } = loginData;

            // Validate required fields
            if (!email || !password) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Email and password are required.'
                );
            }

            // Search in both Doctor and Nurse collections with password field
            const [doctor, nurse] = await Promise.all([
                Doctor.findOne({ email: email.toLowerCase() }).select('+password'),
                Nurse.findOne({ email: email.toLowerCase() }).select('+password')
            ]);
            
            if (!doctor && !nurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Invalid email or password.'
                );
            }

            // Determine user type and validate password
            let user, userType, userId;
            if (doctor) {
                user = doctor;
                userType = 'doctor';
                userId = doctor.doctorId;
            } else {
                user = nurse;
                userType = 'nurse';
                userId = nurse.nurseId;
            }

            // Check if password is set
            if (!user.isPasswordSet || !user.password) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Password not set. Please complete your registration first.'
                );
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new EasyQError(
                    'UnauthorizedError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Invalid email or password.'
                );
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Get hospital adminId
            const hospital = await Hospital.findOne({ hospitalId: user.hospitalId }).select('adminId');
            const adminId = hospital?.adminId || null;

            // Generate JWT token
            const token = jwt.sign(
                {
                    type: userType,
                    data: {
                        userId: userId,
                        role: userType,
                        email: user.email,
                        hospitalId: user.hospitalId,
                        adminId: adminId
                    }
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            logInfo('User login successful', {
                userId: userId,
                userType: userType,
                email: user.email,
                hospitalId: user.hospitalId
            });

            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        userId: userId,
                        name: user.name,
                        email: user.email,
                        userType: userType,
                        hospitalId: user.hospitalId,
                        permissions: user.permissions
                    },
                    adminId: adminId,
                    token: token,
                    loggedInAs: userType
                }
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            logError('Common login error', {
                error: error.message,
                stack: error.stack,
                email: loginData?.email
            });
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to login user.'
            );
        }
    }
}
