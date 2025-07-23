// src/routes/sign/index.js
import express from "express";
import { signUp } from "../../controller/signup.js"; // Assuming controller path is correct

const router = express.Router();


/**
 * @swagger
 * /api/signup:
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
*               - email
 *               - password
 *               - name
 *               - gender
 *               - dateOfBirth
 *               - mobileNumber
 *               - role
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               email:
 *                 type: string
 *               mobileNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, user, doctor]  
 *               location:
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
router.post('/', signUp); // This endpoint will be accessed at /api/signup due to app.use in app.js

export default router;