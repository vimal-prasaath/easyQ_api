import express from 'express';
import { saveFCMToken, getUserFCMTokens, deactivateFCMToken, sendTestNotification } from '../controller/fcmToken.js';

const router = express.Router();

/**
 * @swagger
 * /api/fcm/token:
 *   post:
 *     summary: Save or update FCM token for a user
 *     description: Open API endpoint to save FCM token for push notifications. No authentication required.
 *     tags: [FCM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - fcmToken
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Unique user identifier
 *                 example: "user123"
 *               fcmToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *                 example: "dGVzdF90b2tlbl8xMjM0NTY3ODkw"
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   platform:
 *                     type: string
 *                     enum: [ios, android, web]
 *                     default: android
 *                     example: "android"
 *                   appVersion:
 *                     type: string
 *                     default: "1.0.0"
 *                     example: "1.2.3"
 *                   deviceModel:
 *                     type: string
 *                     default: "Unknown"
 *                     example: "Samsung Galaxy S21"
 *                   osVersion:
 *                     type: string
 *                     default: "Unknown"
 *                     example: "Android 12"
 *     responses:
 *       201:
 *         description: FCM token saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "FCM token saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokenId:
 *                       type: string
 *                       example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *                     userId:
 *                       type: string
 *                       example: "user123"
 *                     isUpdated:
 *                       type: boolean
 *                       example: false
 *       200:
 *         description: FCM token updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "FCM token updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokenId:
 *                       type: string
 *                       example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *                     userId:
 *                       type: string
 *                       example: "user123"
 *                     isUpdated:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 name:
 *                   type: string
 *                   example: "ValidationError"
 *                 message:
 *                   type: string
 *                   example: "userId and fcmToken are required"
 *       409:
 *         description: Conflict - duplicate token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 name:
 *                   type: string
 *                   example: "DuplicateError"
 *                 message:
 *                   type: string
 *                   example: "FCM token already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 name:
 *                   type: string
 *                   example: "InternalServerError"
 *                 message:
 *                   type: string
 *                   example: "Failed to save FCM token"
 */
router.post('/token', saveFCMToken);

/**
 * @swagger
 * /api/fcm/user/{userId}/tokens:
 *   get:
 *     summary: Get all active FCM tokens for a user
 *     description: Retrieve all active FCM tokens for a specific user
 *     tags: [FCM]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique user identifier
 *         example: "user123"
 *     responses:
 *       200:
 *         description: FCM tokens retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "FCM tokens retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "user123"
 *                     tokens:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tokenId:
 *                             type: string
 *                             example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *                           fcmToken:
 *                             type: string
 *                             example: "dGVzdF90b2tlbl8xMjM0NTY3ODkw..."
 *                           deviceInfo:
 *                             type: object
 *                             properties:
 *                               platform:
 *                                 type: string
 *                                 example: "android"
 *                               appVersion:
 *                                 type: string
 *                                 example: "1.2.3"
 *                               deviceModel:
 *                                 type: string
 *                                 example: "Samsung Galaxy S21"
 *                               osVersion:
 *                                 type: string
 *                                 example: "Android 12"
 *                           lastUsed:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId/tokens', getUserFCMTokens);

/**
 * @swagger
 * /api/fcm/token/{tokenId}/deactivate:
 *   put:
 *     summary: Deactivate a specific FCM token
 *     description: Deactivate a specific FCM token by its ID
 *     tags: [FCM]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: FCM token ID
 *         example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *     responses:
 *       200:
 *         description: FCM token deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "FCM token deactivated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokenId:
 *                       type: string
 *                       example: "64f8a1b2c3d4e5f6a7b8c9d0"
 *                     userId:
 *                       type: string
 *                       example: "user123"
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: FCM token not found
 *       500:
 *         description: Internal server error
 */
router.put('/token/:tokenId/deactivate', deactivateFCMToken);

/**
 * @swagger
 * /api/fcm/test:
 *   post:
 *     summary: Send a test push notification to a user
 *     description: Open API to send a sample test notification to the user's most recent active device
 *     tags: [FCM]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "P0001"
 *               title:
 *                 type: string
 *                 example: "Test Notification"
 *               body:
 *                 type: string
 *                 example: "Hi, this is a test notification."
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *               actions:
 *                 type: array
 *                 description: Platform-defined actions for the app to render
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "confirm_yes"
 *                     title:
 *                       type: string
 *                       example: "Yes"
 *                     deeplink:
 *                       type: string
 *                       example: "app://appointment/123?action=yes"
 *               category:
 *                 type: string
 *                 description: iOS category identifier to map actions
 *                 example: "arrival_confirm"
 *               dataOnly:
 *                 type: boolean
 *                 description: If true, send data-only (Android renders locally)
 *                 example: true
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: No active tokens found for user
 *       500:
 *         description: Failed to send notification
 */
router.post('/test', sendTestNotification);

export default router;

