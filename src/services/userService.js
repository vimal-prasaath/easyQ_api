import User from '../model/userProfile.js';
import Appointment from '../model/appointment.js';
import Favourite from '../model/hospitalFavourite.js';
import UserToken from '../model/fcmModel.js';
import SearchSuggestion from '../model/search.js';
import HospitalDetails from '../model/facility.js';
import { generatePasswordHash } from '../util/authController.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { authLogger } from '../config/logger.js';
export class UserService {
    
    static async getAllUsers() {
        try {
            const users = await User.find().select('-_id -__v');
            return users;
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve users: ${error.message}`
            );
        }
    }

    static async getUserById(userId) {
        try {
            const user = await User.findOne({ userId: userId }).select('-_id -__v');
            if (!user) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User not found.'
                );
            }
            return user;
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to find user: ${error.message}`
            );
        }
    }

    static async updateUser(userId, updateData) {
        try {
            const { name, gender, dateOfBirth, email, mobileNumber, password } = updateData;

            const updateFields = {
                name,
                gender,
                dateOfBirth,
                email,
                mobileNumber,
            };

            if (password) {
                updateFields.passwordHash = await generatePasswordHash(password);
            }

            const updatedUser = await User.findOneAndUpdate(
                { userId: userId },
                { $set: updateFields },
                { new: true, runValidators: true }
            ).select('-_id -__v');

            if (!updatedUser) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User not found.'
                );
            }

            return updatedUser;
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to update user: ${error.message}`
            );
        }
    }

    static async deleteUser(userId) {
        try {
            const user = await User.findOne({ userId });
            if (!user) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User not found.'
                );
            }

            await Promise.all([
                Appointment.deleteMany({ patientId: userId }),
                Favourite.deleteMany({ userId }),
                UserToken.deleteMany({ userId }),
                SearchSuggestion.deleteMany({ userId }),
                HospitalDetails.deleteMany({ userId }),
                User.deleteOne({ userId })
            ]);

            return {
                message: 'User and related data deleted successfully',
                deletedUserId: userId
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to delete user and related data: ${error.message}`
            );
        }
    }

    static async createUser(userData) {
        try {
            if (userData.password) {
                userData.passwordHash = await generatePasswordHash(userData.password);
                delete userData.password;
            }

            const user = await User.create(userData);
            return user;
        } catch (error) {
            if (error.code === 11000) {
                const duplicateField = Object.keys(error.keyValue)[0];
                throw new EasyQError(
                    'DuplicateError',
                    httpStatusCode.CONFLICT,
                    true,
                    `User with this ${duplicateField} already exists.`
                );
            }
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to create user: ${error.message}`
            );
        }
    }

    static async searchUsers(searchQuery, options = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;

            const searchRegex = new RegExp(searchQuery, 'i');
            const query = {
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { mobileNumber: searchRegex },
                    { userId: searchRegex }
                ]
            };

            const users = await User.find(query)
                .select('-_id -__v')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(limit);

            const totalCount = await User.countDocuments(query);

            return {
                users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: page < Math.ceil(totalCount / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to search users: ${error.message}`
            );
        }
    }

    static async getUserStats() {
        try {
            const totalUsers = await User.countDocuments();
            const activeUsers = await User.countDocuments({ isActive: true });
            const inactiveUsers = totalUsers - activeUsers;

            const usersByGender = await User.aggregate([
                { $group: { _id: '$gender', count: { $sum: 1 } } }
            ]);

            const recentUsers = await User.find()
                .select('-_id -__v')
                .sort({ createdAt: -1 })
                .limit(5);

            return {
                totalUsers,
                activeUsers,
                inactiveUsers,
                usersByGender,
                recentUsers
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to get user statistics: ${error.message}`
            );
        }
    }

    static async activateUser(userId) {
        try {
            const userToActivate = await User.findOne({ userId });

            if (!userToActivate) {
                authLogger.warn('UserService.activateUser: User not found', { userId });
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User not found.'
                );
            }

            if (userToActivate.role !== 'admin') {
                authLogger.warn('UserService.activateUser: Attempt to activate non-admin user as admin', { userId, role: userToActivate.role });
                throw new EasyQError(
                    'BadRequestError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Only admin roles can be activated via this endpoint.'
                );
            }

            if (userToActivate.isActive) {
                authLogger.info('UserService.activateUser: User is already active', { userId });
                return userToActivate;
            }

            userToActivate.isActive = true;
            await userToActivate.save();

            authLogger.info('UserService.activateUser: Admin user activated successfully', { userId });
            return userToActivate;
        } catch (error) {
            authLogger.error('UserService.activateUser error:', { userId, errorMessage: error.message, stack: error.stack });
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to activate user: ${error.message}`
            );
        }
    }
    
     static async resetPassword(userId, newPassword) {
        try {
            if (!newPassword) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'New password is required.'
                );
            }

            const passwordHash = await generatePasswordHash(newPassword);

            const updatedUser = await User.findOneAndUpdate(
                { userId: userId },
                { $set: { passwordHash: passwordHash } },
                { new: true, runValidators: true, select: '-_id -__v -passwordHash' }
            );

            if (!updatedUser) {
                authLogger.warn('UserService.resetPassword: User not found for password reset', { userId });
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'User not found.'
                );
            }

            authLogger.info('UserService.resetPassword: User password reset successfully', { userId });
            return updatedUser;
        } catch (error) {
            authLogger.error('UserService.resetPassword error:', { userId, errorMessage: error.message, stack: error.stack });
            if (error instanceof EasyQError) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to reset user password: ${error.message}`
            );
        }
    }
    
    static async getAllInActiveUsers() {
        try {
            const inactiveUsers = await User.find({ isActive: false }).select('-_id -__v');
            return inactiveUsers;
        } catch (error) {
            authLogger.error('UserService.getAllInActiveUsers error:', { errorMessage: error.message, stack: error.stack });
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve inactive users: ${error.message}`
            );
        }
    }
}