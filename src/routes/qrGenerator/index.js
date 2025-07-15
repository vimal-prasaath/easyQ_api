
import express from 'express'
import {qrGeneator , getQRCode} from '../../controller/qrgeneratorControllr.js'
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
import authorizeRoles from "../../middleware/authorization.js";
const router=express.Router()

/**
 * @swagger
 * /api/qrgenerator:
 *   post:
 *     summary: Generate a QR code for an appointment
 *     tags: [QR Code]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - appointmentId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user
 *               appointmentId:
 *                 type: string
 *                 description: The ID of the appointment
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: QR code generated and attached to appointment successfully.
 *                 qrCode:
 *                   type: string
 *                   description: Base64 encoded QR code image
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or appointment not found
 *       500:
 *         description: Server error
 */
router.post('/',authorizeOwnerOrAdmin,qrGeneator)

/**
 * @swagger
 * /api/qrgenerator/getdetails:
 *   get:
 *     summary: Get QR code details for an appointment
 *     tags: [QR Code]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *       - in: query
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the appointment
 *     responses:
 *       200:
 *         description: QR code details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCodeData:
 *                   type: string
 *                   description: QR code data or URL
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or appointment not found
 *       500:
 *         description: Server error
 */
router.get('/getdetails',authorizeOwnerOrAdmin,getQRCode)

export default router