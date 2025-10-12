import express from 'express';
import { addUserAddress, getUserAddresses, updateUserAddress, deleteUserAddress } from '../../controller/userAddressController.js';
import { orchestratorRateLimit } from '../../notificationOrchestrator/middleware/rateLimit.js';

const router = express.Router();

/**
 * @swagger
 * /api/user/address:
 *   post:
 *     summary: Add new address to user
 *     description: Add a new address with coordinates to user's address list
 *     tags: [User Address Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - addressName
 *               - origin
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "P0001"
 *               addressName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Home"
 *               origin:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: 12.9716
 *                   lng:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: 77.5946
 *               fullAddress:
 *                 type: string
 *                 maxLength: 500
 *                 example: "123 Main Street, Bangalore, Karnataka, India"
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Address added successfully
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
 *                   example: "Address added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "P0001"
 *                     address:
 *                       type: object
 *                       properties:
 *                         addressId:
 *                           type: string
 *                           example: "uuid-address-id"
 *                         addressName:
 *                           type: string
 *                           example: "Home"
 *                         origin:
 *                           type: object
 *                           properties:
 *                             lat:
 *                               type: number
 *                               example: 12.9716
 *                             lng:
 *                               type: number
 *                               example: 77.5946
 *                         fullAddress:
 *                           type: string
 *                           example: "123 Main Street, Bangalore, Karnataka, India"
 *                         isDefault:
 *                           type: boolean
 *                           example: true
 */
router.post('/address', orchestratorRateLimit, addUserAddress);

/**
 * @swagger
 * /api/user/address/{userId}:
 *   get:
 *     summary: Get all user addresses
 *     description: Retrieve all addresses for a user including coordinates
 *     tags: [User Address Management]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "P0001"
 *     responses:
 *       200:
 *         description: User addresses retrieved successfully
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
 *                   example: "User addresses retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "P0001"
 *                     addresses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           addressId:
 *                             type: string
 *                             example: "uuid-address-id"
 *                           addressName:
 *                             type: string
 *                             example: "Home"
 *                           origin:
 *                             type: object
 *                             properties:
 *                               lat:
 *                                 type: number
 *                                 example: 12.9716
 *                               lng:
 *                                 type: number
 *                                 example: 77.5946
 *                           fullAddress:
 *                             type: string
 *                             example: "123 Main Street, Bangalore, Karnataka, India"
 *                           isDefault:
 *                             type: boolean
 *                             example: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     totalCount:
 *                       type: number
 *                       example: 2
 */
router.get('/address/:userId', orchestratorRateLimit, getUserAddresses);

/**
 * @swagger
 * /api/user/address/{userId}/{addressId}:
 *   put:
 *     summary: Update specific user address
 *     description: Update a specific address for a user
 *     tags: [User Address Management]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "P0001"
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *         example: "uuid-address-id"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Updated Home"
 *               origin:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: 12.9716
 *                   lng:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: 77.5946
 *               fullAddress:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Updated address"
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.put('/address/:userId/:addressId', orchestratorRateLimit, updateUserAddress);

/**
 * @swagger
 * /api/user/address/{userId}/{addressId}:
 *   delete:
 *     summary: Delete user address
 *     description: Delete a specific address for a user
 *     tags: [User Address Management]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "P0001"
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *         example: "uuid-address-id"
 *     responses:
 *       200:
 *         description: Address deleted successfully
 */
router.delete('/address/:userId/:addressId', orchestratorRateLimit, deleteUserAddress);

export default router;
