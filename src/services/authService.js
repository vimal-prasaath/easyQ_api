
import User from '../model/userProfile.js';
import { getUserDetails,createUser } from '../util/authController.js';
import { validUser, updateToken, getToken } from '../util/loginHandler.js';
import { generatePasswordHash } from '../util/authController.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

export class AuthService {
    
    static async login(phoneNumber) {
        try {
            const userData = await getUserDetails(phoneNumber);

            // if (!userData) {
            //     await createUser(phoneNumber)
            // }
            // const token = await getToken(userData);
            // const valid = await validUser(password, userData.passwordHash);

            // if (!valid) {
            //     throw new EasyQError(
            //         'AuthenticationError',
            //         httpStatusCode.UNAUTHORIZED,
            //         true,
            //         'Invalid credentials.'
            //     );
            // }

            // if (token) {
            //     const tokenUpdateResult = await updateToken(userData.userId, token);
            //     if (!tokenUpdateResult.success) {
            //         throw new EasyQError(
            //             'AuthenticationError',
            //             httpStatusCode.INTERNAL_SERVER_ERROR,
            //             false,
            //             `Failed to update token: ${tokenUpdateResult.error}`
            //         );
            //     }
            // }

            return {
                message: 'Login successful',
                user: {
                    userId: userData.userId,
                    profileUpadate: userData.profileUpadate,
                }
            };
        } catch (error) {
            console.log(error)
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'AuthenticationError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Login failed: ${error.message}`
            );
        }
    }

    static async createUser(userData) {
        try {
            if (!userData.email || !userData.phoneNumber) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Email and phoneNumber are required for registration.'
                );
            }

            const existingUser = await User.findOne({ phoneNumber: userData.phoneNumber });
             console.log(existingUser,"ooo")
            // if (existingUser) {
            //     throw new EasyQError(
            //         'ConflictError',
            //         httpStatusCode.CONFLICT,
            //         true,
            //         'User with this email already exists.'
            //     );
            // }
            //password
            // const hashedPassword = await generatePasswordHash(userData.password);
            // const newUserData = {
            //     ...userData,
            //     passwordHash: hashedPassword
            // };
            // delete newUserData.password;
            console.log(existingUser,"ooo")
        const allowedFields = ['name', 'phoneNumber', 'gender', 'dateOfBirth','email','role'];
         allowedFields.forEach(field => {
            if (userData[field] !== undefined) {
                existingUser[field] = userData[field];
            }
        });
        existingUser.profileUpadate = true
        existingUser.save()

            // const newUserData = {
            //     ...userData,
            //     profileUpadate: true
            // };

            // const newUser = await User(newUserData);

            return {
                message: 'User registered successfully!',
                user: {
                    userId: existingUser.userId,
                    email: existingUser.email
                }
            };
        } catch (error) {
            console.log(error)
            if (error instanceof EasyQError) {
                throw error;
            }
            if (error.name === 'ValidationError' && error.errors) {
                const messages = Object.values(error.errors).map(val => val.message);
                console.log(messages)
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            if (error.code === 11000) {
                const duplicateField = Object.keys(error.keyValue)[0];
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    `User with this ${duplicateField} already exists.`
                );
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Registration failed: ${error.message}`
            );
        }
    }

    static async logout(userId) {
        try {
            const result = await updateToken(userId, null);
            if (result.error) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.INTERNAL_SERVER_ERROR,
                    false,
                    `Failed to logout: ${result.error}`
                );
            }

            return { message: 'Logout successful' };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'AuthenticationError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Logout failed: ${error.message}`
            );
        }
    }

    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User.findOne({ userId: userId });
            if (!user) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User not found.'
                );
            }

            const isCurrentPasswordValid = await validUser(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Current password is incorrect.'
                );
            }

            const newPasswordHash = await generatePasswordHash(newPassword);
            await User.findOneAndUpdate(
                { userId: userId },
                { $set: { passwordHash: newPasswordHash } }
            );

            return { message: 'Password changed successfully' };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Password change failed: ${error.message}`
            );
        }
    }

    static async refreshToken(userId) {
        try {
            const userData = await User.findOne({ userId: userId });
            if (!userData) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User not found.'
                );
            }

            const newToken = await getToken(userData);
            if (!newToken) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.INTERNAL_SERVER_ERROR,
                    false,
                    'Failed to generate new token.'
                );
            }

            const tokenUpdateResult = await updateToken(userId, newToken);
            if (tokenUpdateResult.error) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.INTERNAL_SERVER_ERROR,
                    false,
                    `Failed to update token: ${tokenUpdateResult.error}`
                );
            }

            return {
                message: 'Token refreshed successfully',
                token: newToken
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'AuthenticationError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Token refresh failed: ${error.message}`
            );
        }
    }

    static async verifyToken(token) {
        try {
            const user = await User.findOne({ token: token });
            if (!user) {
                throw new EasyQError(
                    'AuthenticationError',
                    httpStatusCode.UNAUTHORIZED,
                    true,
                    'Invalid or expired token.'
                );
            }

            return {
                isValid: true,
                user: {
                    userId: user.userId,
                    email: user.email,
                    name: user.name
                }
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'AuthenticationError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Token verification failed: ${error.message}`
            );
        }
    }

    static async resetPassword(email) {
        try {
            const user = await User.findOne({ email: email });
            if (!user) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User with this email does not exist.'
                );
            }

            const resetToken = await getToken(user);
            await User.findOneAndUpdate(
                { email: email },
                { $set: { resetToken: resetToken, resetTokenExpiry: Date.now() + 3600000 } }
            );

            return {
                message: 'Password reset token generated successfully',
                resetToken: resetToken
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Password reset failed: ${error.message}`
            );
        }
    }
}
