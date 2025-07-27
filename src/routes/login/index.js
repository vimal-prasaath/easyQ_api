// src/routes/login/index.js
import express from "express";
import { login } from "../../controller/login.js"; // Assuming controller path is correct
import { resetUserPassword } from "../../controller/user.js"; // Assuming controller path is correct
import authenticate from "../../middleware/auth.js";
const router = express.Router();


/**
 * @swagger
 * /api/login:
 *   post:
 *     summary:  Authenticate user and generate token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate,login); // This endpoint will be accessed at /api/login due to app.use in app.js

/**
 * @swagger
 * /api/resetPassword:
 *   post:
 *     summary: Request to reset user password
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - email
 *             properties:
 *               email:
 *                  type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.post('/resetPassword', resetUserPassword); // This endpoint will be accessed at /api/user/resetPassword due to app.use in app.js

export default router;