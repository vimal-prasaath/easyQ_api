import express from 'express';
import {getAllUser,updateUser,finduser, deleteUser , resetUserPassword , activateUser, getAllInActiveUser} from "../../controller/user.js"
import authorizeRoles from '../../middleware/authorization.js';
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js"
const router = express.Router();

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authorizeRoles, getAllUser)
router.get('/admins',authorizeRoles,getAllInActiveUser)

/**
 * @swagger
 * /api/user/{userId}:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/:userId', authorizeOwnerOrAdmin, updateUser);
router.put('/activate/:userId',authorizeRoles, activateUser);
router.put('/reset-password', authorizeOwnerOrAdmin, resetUserPassword);

/**
 * @swagger
 * /api/user/getUser:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/getUser', authorizeOwnerOrAdmin, finduser);
router.delete('/delete/:userId',  authorizeOwnerOrAdmin, deleteUser)


export default router;
