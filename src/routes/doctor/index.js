import { createDoctor, getDoctor, deleteDoctor, getAllDoctor, updateDoctor, uploadDoctorImage } from "../../controller/doctor.js";
import express from "express";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
import authorizeRoles from "../../middleware/authorization.js";
import authenticateAdmin from "../../middleware/adminAuth.js";
import adminVerificationCheck from "../../middleware/adminVerificationCheck.js";
import { uploadMiddleware, multerErrorHandler } from "../../config/fileConfig.js";
const router = express.Router();

/**
 * @swagger
 * /api/doctor/add:
 *   post:
 *     summary: Create a new doctor
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - name
 *               - email
 *               - mobileNumber
 *               - specialization
 *               - hospitalId
 *               - consultantFee
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Admin ID (required for verification)
 *               name:
 *                 type: string
 *                 description: Doctor name
 *               email:
 *                 type: string
 *                 description: Doctor email
 *               mobileNumber:
 *                 type: string
 *                 description: Doctor mobile number
 *               specialization:
 *                 type: string
 *                 description: Doctor specialization
 *               hospitalId:
 *                 type: string
 *                 description: Hospital ID
 *               consultantFee:
 *                 type: number
 *                 description: Consultant fee
 *               status:
 *                 type: string
 *                 description: Doctor status (Available/Unavailable)
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Invalid input data - adminId is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin verification required - Only approved admins can add doctors
 */
router.post("/add", authenticateAdmin, adminVerificationCheck, createDoctor)

/**
 * @swagger
 * /api/doctor/get:
 *   post:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *             properties:
 *               doctorId:
 *                 type: string
 *                 description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Doctor'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 * 
 * /api/doctor/update:
 *   put:
 *     summary: Update doctor details
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *             properties:
 *               doctorId:
 *                 type: string
 *                 description: Doctor ID
 *               name:
 *                 type: string
 *                 description: Doctor name
 *               email:
 *                 type: string
 *                 description: Doctor email
 *               mobileNumber:
 *                 type: string
 *                 description: Doctor mobile number
 *               specialization:
 *                 type: string
 *                 description: Doctor specialization
 *               consultantFee:
 *                 type: number
 *                 description: Consultant fee
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 * 
 * /api/doctor/delete:
 *   delete:
 *     summary: Delete a doctor
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - doctorId
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Admin ID (required for verification)
 *               doctorId:
 *                 type: string
 *                 description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       400:
 *         description: Invalid input data - adminId is required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin verification required - Only approved admins can delete doctors
 *       404:
 *         description: Doctor not found
 */
router.post("/get", authorizeOwnerOrAdmin, getDoctor)
router.put("/update", authorizeRoles, updateDoctor)
router.delete("/delete", authenticateAdmin, adminVerificationCheck, deleteDoctor)
/**
 * @swagger
 * /api/doctor/all/{hospitalId}:
 *   get:
 *     summary: Get all doctors in a hospital
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the hospital
 *     responses:
 *       200:
 *         description: List of doctors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Doctor'
 *       401:
 *         description: Unauthorized
 */
router.get("/all/:hospitalId",authorizeOwnerOrAdmin, getAllDoctor)

/**
 * @swagger
 * /api/doctor/upload-image:
 *   put:
 *     summary: Upload doctor profile image
 *     tags: [Doctors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - doctorId
 *               - file
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Admin ID (required for verification)
 *               doctorId:
 *                 type: string
 *                 description: Doctor ID
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Doctor profile image (JPEG, PNG - max 5MB)
 *     responses:
 *       200:
 *         description: Doctor image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profileImage:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - missing adminId, doctorId, file or invalid file
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 *       413:
 *         description: File too large
 *       403:
 *         description: Admin verification required - Only approved admins can upload doctor images
 *       415:
 *         description: Unsupported media type
 *       500:
 *         description: Internal server error
 */
router.put('/upload-image',
    authenticateAdmin,
    adminVerificationCheck,
    uploadMiddleware.single('file'),
    multerErrorHandler,
    uploadDoctorImage
);

export default router;