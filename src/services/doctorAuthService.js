import Doctor from '../model/doctor.js';
import Hospital from '../model/hospital.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';

export class DoctorAuthService {
    
    static async doctorSignup(signupData) {
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

            // Check if doctor exists with this email
            const doctor = await Doctor.findOne({ email: email.toLowerCase() });
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Doctor not found with this email address. Please contact your administrator.'
                );
            }

            // Check if password is already set
            if (doctor.isPasswordSet) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    'Password is already set for this doctor account.'
                );
            }

            // Hash password
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Update doctor with password
            doctor.password = hashedPassword;
            doctor.isPasswordSet = true;
            await doctor.save();

            logInfo('Doctor password set successfully', {
                doctorId: doctor.doctorId,
                email: doctor.email
            });

            return {
                success: true,
                message: 'Password set successfully. You can now login.',
                doctorId: doctor.doctorId,
                email: doctor.email
            };

        } catch (error) {
            logError('Error in doctor signup', {
                error: error.message,
                email: signupData.email
            });
            throw error;
        }
    }

    static async doctorLogin(loginData) {
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

            // Find doctor with password field included
            const doctor = await Doctor.findOne({ email: email.toLowerCase() }).select('+password');
            
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Invalid email or password.'
                );
            }

            // Check if password is set
            if (!doctor.isPasswordSet || !doctor.password) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Password not set. Please complete your registration first.'
                );
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, doctor.password);
            if (!isPasswordValid) {
                throw new EasyQError(
                    'UnauthorizedError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Invalid email or password.'
                );
            }

            // Update last login
            doctor.lastLogin = new Date();
            await doctor.save();

            // Get hospital adminId
            const hospital = await Hospital.findOne({ hospitalId: doctor.hospitalId }).select('adminId');
            const adminId = hospital?.adminId || null;

            // Generate JWT token
            const token = jwt.sign(
                { 
                    doctorId: doctor.doctorId,
                    email: doctor.email,
                    type: 'doctor'
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            // Remove password from response
            const doctorResponse = doctor.toObject();
            delete doctorResponse.password;

            logInfo('Doctor logged in successfully', {
                doctorId: doctor.doctorId,
                email: doctor.email,
                adminId: adminId
            });

            return {
                success: true,
                message: 'Doctor logged in successfully',
                data: {
                    doctor: doctorResponse,
                    adminId: adminId,
                    token: token
                }
            };

        } catch (error) {
            logError('Error in doctor login', {
                error: error.message,
                email: loginData.email
            });
            throw error;
        }
    }

    static async getDoctorProfile(doctorId) {
        try {
            const doctor = await Doctor.findOne({ doctorId });
            
            if (!doctor) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Doctor not found.'
                );
            }

            // Get hospital adminId
            const hospital = await Hospital.findOne({ hospitalId: doctor.hospitalId }).select('adminId');
            const adminId = hospital?.adminId || null;

            return {
                success: true,
                message: 'Doctor profile retrieved successfully',
                data: { 
                    doctor,
                    adminId: adminId
                }
            };

        } catch (error) {
            logError('Error retrieving doctor profile', {
                error: error.message,
                doctorId
            });
            throw error;
        }
    }
}
