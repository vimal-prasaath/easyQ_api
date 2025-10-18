import FCMToken from '../model/fcmToken.js';
import { logInfo, logError } from '../config/logger.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import admin from '../config/firebaseAdmin.js';

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

/**
 * Send a test push notification to the user's most recent active device
 * Open API (no auth) for testing purposes
 * body: { userId: string, title?: string, body?: string, data?: object }
 */
export const sendTestNotification = async (req, res, next) => {
    try {
        const { userId, title, body, data, actions, category, dataOnly } = req.body || {};

        if (!userId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'userId is required'
            );
        }

        // Get most recent active token for this user (active device only)
        const tokens = await FCMToken.findActiveTokensByUserId(userId);
        if (!tokens || tokens.length === 0) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'No active FCM tokens found for this user'
            );
        }

        const primaryToken = tokens[0];

        const payloadData = Object.assign({}, data);
        if (Array.isArray(actions) && actions.length > 0) {
            // Serialize actions array for transport in data-only payloads
            try { payloadData.actions = JSON.stringify(actions); } catch (_) {}
        }
        if (category) {
            payloadData.category = String(category);
        }

        const message = {
            token: primaryToken.fcmToken,
            data: payloadData
        };

        if (!dataOnly) {
            message.notification = {
                title: title || 'Test Notification',
                body: body || 'Hi, this is a test notification.'
            };
        }

        const response = await admin.messaging().send(message);

        logInfo('Test notification sent', {
            userId,
            tokenId: primaryToken._id,
            messageId: response
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Notification sent successfully',
            data: {
                userId,
                tokenId: primaryToken._id,
                messageId: response
            }
        });
    } catch (error) {
        // Handle invalid token errors by deactivating the token
        const tokenErrorCodes = new Set([
            'messaging/invalid-argument',
            'messaging/registration-token-not-registered'
        ]);

        if (error && error.code && tokenErrorCodes.has(error.code)) {
            try {
                const { userId } = req.body || {};
                const tokens = userId ? await FCMToken.findActiveTokensByUserId(userId) : [];
                const primary = tokens && tokens[0];
                if (primary) {
                    primary.isActive = false;
                    await primary.save();
                    logInfo('Deactivated invalid FCM token', { tokenId: primary._id, userId });
                }
                
                // Return success response even if token was invalid
                return res.status(httpStatusCode.OK).json({
                    status: 'success',
                    message: 'Token was invalid and has been deactivated. Please refresh your app token.',
                    data: {
                        userId,
                        tokenDeactivated: true,
                        reason: error.code
                    }
                });
            } catch (deactivateErr) {
                logError(deactivateErr);
            }
        }

        logError(error, { userId: req.body?.userId });

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
 * Send a test appointment booking notification
 * Open API (no auth) for testing purposes
 * body: { userId: string, hospitalName: string, appointmentDate: string, appointmentTime: string }
 */
export const sendTestAppointmentBookingNotification = async (req, res, next) => {
    try {
        const { userId, hospitalName, appointmentDate, appointmentTime } = req.body || {};

        if (!userId || !hospitalName || !appointmentDate || !appointmentTime) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'userId, hospitalName, appointmentDate, and appointmentTime are required'
            );
        }

        const { NotificationOrchestrator } = await import('../services/notificationOrchestrator.js');
        const result = await NotificationOrchestrator.sendTestAppointmentBookingNotification(
            userId,
            hospitalName,
            appointmentDate,
            appointmentTime
        );

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Test appointment booking notification sent successfully',
            data: result
        });

    } catch (error) {
        logError('Failed to send test appointment booking notification', {
            error: error.message,
            userId: req.body?.userId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            'Failed to send test appointment booking notification'
        ));
    }
};

/**
 * Test distance calculation between user and hospital
 * Open API (no auth) for testing purposes
 * body: { userId: string, hospitalId: string }
 */
export const testDistanceCalculation = async (req, res, next) => {
    try {
        const { userId, hospitalId } = req.body || {};

        if (!userId || !hospitalId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'userId and hospitalId are required'
            );
        }

        const { calculateUserHospitalDistance, calculateApproximateTravelTime } = await import('../util/distanceCalculator.js');
        const User = (await import('../model/userProfile.js')).default;
        const Hospital = (await import('../model/hospital.js')).default;

        // Get user and hospital data
        const user = await User.findOne({ userId });
        const hospital = await Hospital.findOne({ hospitalId });

        if (!user) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `User ${userId} not found`
            );
        }

        if (!hospital) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Hospital ${hospitalId} not found`
            );
        }

        // Calculate distance and travel time
        const distance = calculateUserHospitalDistance(user, hospital);
        const approximateTime = await calculateApproximateTravelTime(user, hospital);

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Distance and time calculation test completed',
            data: {
                userId,
                hospitalId,
                userAddress: user.addresses?.find(addr => addr.isDefault) || user.addresses?.[0] || null,
                hospitalLocation: hospital.location,
                distance: distance, // Distance in kilometers
                distanceUnit: 'km',
                approximateTime: approximateTime // Travel time range like "10-15 min"
            }
        });

    } catch (error) {
        logError('Failed to test distance and time calculation', {
            error: error.message,
            userId: req.body?.userId,
            hospitalId: req.body?.hospitalId
        });

        if (error instanceof EasyQError) {
            return next(error);
        }

        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            'Failed to test distance and time calculation'
        ));
    }
};

