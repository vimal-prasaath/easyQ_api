import Nurse from '../model/nurse.js';
import Hospital from '../model/hospital.js';
import bcrypt from 'bcrypt';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';
import { StaffAuthTokenService } from '../util/staffAuthTokenService.js';

export class NurseAuthService {
    
    static async nurseSignup(signupData) {
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

            // Check if nurse exists with this email
            const nurse = await Nurse.findOne({ email: email.toLowerCase() });
            if (!nurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Nurse not found with this email address. Please contact your administrator.'
                );
            }

            // Check if password is already set
            if (nurse.isPasswordSet) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    'Password is already set for this nurse account.'
                );
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Update nurse with password
            nurse.password = hashedPassword;
            nurse.isPasswordSet = true;
            await nurse.save();

            logInfo('Nurse password set successfully', {
                nurseId: nurse.nurseId,
                email: nurse.email
            });

            return {
                success: true,
                message: 'Nurse account activated successfully',
                data: {
                    nurseId: nurse.nurseId,
                    email: nurse.email
                }
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            logError('Nurse signup error', {
                error: error.message,
                stack: error.stack,
                email: signupData?.email
            });
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to activate nurse account.'
            );
        }
    }

    static async nurseLogin(loginData) {
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

            // Find nurse with password field included
            const nurse = await Nurse.findOne({ email: email.toLowerCase() }).select('+password');
            
            if (!nurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Invalid email or password.'
                );
            }

            // Check if password is set
            if (!nurse.isPasswordSet || !nurse.password) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Password not set. Please complete your registration first.'
                );
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, nurse.password);
            if (!isPasswordValid) {
                throw new EasyQError(
                    'UnauthorizedError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Invalid email or password.'
                );
            }

            const hospital = await Hospital.findOne({ hospitalId: nurse.hospitalId }).select('adminId');
            const adminId = hospital?.adminId || null;

            const { token, refreshToken } = await StaffAuthTokenService.issueTokens(nurse, 'nurse');

            logInfo('Nurse login successful', {
                nurseId: nurse.nurseId,
                email: nurse.email,
                hospitalId: nurse.hospitalId
            });

            return {
                success: true,
                message: 'Login successful',
                data: {
                    nurse: {
                        nurseId: nurse.nurseId,
                        name: nurse.name,
                        email: nurse.email,
                        hospitalId: nurse.hospitalId,
                        permissions: nurse.permissions
                    },
                    adminId: adminId,
                    token: token,
                    refreshToken: refreshToken,
                    loggedInAs: "nurse"
                }
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            logError('Nurse login error', {
                error: error.message,
                stack: error.stack,
                email: loginData?.email
            });
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to login nurse.'
            );
        }
    }

    static async getNurseProfile(nurseId) {
        try {
            const nurse = await Nurse.findOne({ nurseId })
                .select('-_id -__v -password')
                .lean();

            if (!nurse) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Nurse not found with the provided ID.'
                );
            }

            // Get hospital adminId
            const hospital = await Hospital.findOne({ hospitalId: nurse.hospitalId }).select('adminId');
            const adminId = hospital?.adminId || null;

            return {
                success: true,
                message: 'Nurse profile retrieved successfully',
                data: { 
                    nurse,
                    adminId: adminId,
                    loggedInAs: "nurse"
                }
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            logError('Get nurse profile error', {
                error: error.message,
                stack: error.stack,
                nurseId
            });
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                'Failed to retrieve nurse profile.'
            );
        }
    }
}
