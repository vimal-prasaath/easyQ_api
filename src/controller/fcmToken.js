import FCMToken from '../model/fcmToken.js';
import { logInfo, logError } from '../config/logger.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

/**
 * Save or update FCM token for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const saveFCMToken = async (req, res, next) => {
    try {
        const { userId, fcmToken, deviceInfo } = req.body;

        // Validate required fields
        if (!userId || !fcmToken) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'userId and fcmToken are required'
            );
        }

        // Validate FCM token format (basic validation)
        if (typeof fcmToken !== 'string' || fcmToken.length < 10) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Invalid FCM token format'
            );
        }

        // Check if token already exists
        const existingToken = await FCMToken.findOne({ fcmToken });

        if (existingToken) {
            // Update existing token
            existingToken.userId = userId;
            existingToken.deviceInfo = {
                platform: deviceInfo?.platform || 'android',
                appVersion: deviceInfo?.appVersion || '1.0.0',
                deviceModel: deviceInfo?.deviceModel || 'Unknown',
                osVersion: deviceInfo?.osVersion || 'Unknown'
            };
            existingToken.isActive = true;
            existingToken.lastUsed = new Date();
            existingToken.updatedAt = new Date();

            await existingToken.save();

            logInfo('FCM token updated', {
                userId,
                fcmToken: fcmToken.substring(0, 20) + '...',
                deviceInfo: existingToken.deviceInfo
            });

            return res.status(200).json({
                status: 'success',
                message: 'FCM token updated successfully',
                data: {
                    tokenId: existingToken._id,
                    userId: existingToken.userId,
                    isUpdated: true
                }
            });
        }

        // Deactivate old tokens for this user (keep only latest 3)
        await FCMToken.deactivateOldTokens(userId, 3);

        // Create new token
        const newToken = new FCMToken({
            userId,
            fcmToken,
            deviceInfo: {
                platform: deviceInfo?.platform || 'android',
                appVersion: deviceInfo?.appVersion || '1.0.0',
                deviceModel: deviceInfo?.deviceModel || 'Unknown',
                osVersion: deviceInfo?.osVersion || 'Unknown'
            }
        });

        await newToken.save();

        logInfo('FCM token created', {
            userId,
            fcmToken: fcmToken.substring(0, 20) + '...',
            deviceInfo: newToken.deviceInfo
        });

        res.status(201).json({
            status: 'success',
            message: 'FCM token saved successfully',
            data: {
                tokenId: newToken._id,
                userId: newToken.userId,
                isUpdated: false
            }
        });

    } catch (error) {
        logError(error, {
            userId: req.body?.userId,
            fcmToken: req.body?.fcmToken ? req.body.fcmToken.substring(0, 20) + '...' : 'N/A',
            deviceInfo: req.body?.deviceInfo
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return next(new EasyQError(
                'DuplicateError',
                httpStatusCode.CONFLICT,
                true,
                'FCM token already exists'
            ));
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to save FCM token'
        ));
    }
};

/**
 * Get all active FCM tokens for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getUserFCMTokens = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'userId is required'
            );
        }

        const tokens = await FCMToken.findActiveTokensByUserId(userId);

        res.status(200).json({
            status: 'success',
            message: 'FCM tokens retrieved successfully',
            data: {
                userId,
                tokens: tokens.map(token => ({
                    tokenId: token._id,
                    fcmToken: token.fcmToken.substring(0, 20) + '...',
                    deviceInfo: token.deviceInfo,
                    lastUsed: token.lastUsed,
                    createdAt: token.createdAt
                }))
            }
        });

    } catch (error) {
        logError(error, {
            userId: req.params?.userId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to retrieve FCM tokens'
        ));
    }
};

/**
 * Deactivate a specific FCM token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const deactivateFCMToken = async (req, res, next) => {
    try {
        const { tokenId } = req.params;

        if (!tokenId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'tokenId is required'
            );
        }

        const token = await FCMToken.findById(tokenId);

        if (!token) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'FCM token not found'
            );
        }

        token.isActive = false;
        token.updatedAt = new Date();
        await token.save();

        logInfo('FCM token deactivated', {
            tokenId,
            userId: token.userId
        });

        res.status(200).json({
            status: 'success',
            message: 'FCM token deactivated successfully',
            data: {
                tokenId: token._id,
                userId: token.userId
            }
        });

    } catch (error) {
        logError(error, {
            tokenId: req.params?.tokenId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to deactivate FCM token'
        ));
    }
};

