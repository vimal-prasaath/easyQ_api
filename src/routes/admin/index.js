import express from 'express';
import {
    adminSignup,
    adminLogin,
    updateOnboardingInfo,
    updateHospitalDocuments,
    updateOwnerDocuments,
    getAdminDetails,
    getAdminDashboard,
    updateOwnerInfo,
    updateHospitalBasicInfo
} from '../../controller/admin.js';
import authenticateAdmin from '../../middleware/adminAuth.js';
import { uploadMiddleware, multerErrorHandler } from '../../config/fileConfig.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/signup:
 *   post:
 *     summary: Create a new admin account
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Admin password (minimum 8 characters)
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 description: Admin username (minimum 3 characters)
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     admin:
 *                       type: object
 *                       properties:
 *                         adminId:
 *                           type: string
 *                         email:
 *                           type: string
 *                         username:
 *                           type: string
 *                         verificationStatus:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         onboardingProgress:
 *                           type: number
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication (automatically generated)
 *       400:
 *         description: Validation error
 *       409:
 *         description: Admin with this email/username already exists
 *       500:
 *         description: Internal server error
 */
router.post('/signup', adminSignup);

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Authenticate admin and get JWT token
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *               password:
 *                 type: string
 *                 description: Admin password
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     admin:
 *                       type: object
 *                       properties:
 *                         adminId:
 *                           type: string
 *                         email:
 *                           type: string
 *                         username:
 *                           type: string
 *                         verificationStatus:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         onboardingProgress:
 *                           type: number
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *       401:
 *         description: Invalid credentials or inactive account
 *       500:
 *         description: Internal server error
 */
router.post('/login', adminLogin);

/**
 * @swagger
 * /api/admin/onboarding:
 *   put:
 *     summary: Update complete onboarding information (all steps at once)
 *     tags: [Admin Onboarding]
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
 *               - ownerName
 *               - ownerMobile
 *               - ownerProof
 *               - ownerProofNumber
 *               - hospitalName
 *               - hospitalType
 *               - registrationNumber
 *               - address
 *               - city
 *               - state
 *               - pincode
 *               - phoneNumber
 *               - workingDays
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Admin ID (e.g., A0001)
 *               # Owner Information
 *               ownerName:
 *                 type: string
 *                 description: Owner full name
 *               ownerMobile:
 *                 type: string
 *                 pattern: '^[0-9]{10}$'
 *                 description: 10-digit mobile number
 *               ownerProof:
 *                 type: string
 *                 enum: [Aadhar, PAN, Driving License, Voter ID]
 *                 description: Type of identity proof
 *               ownerProofNumber:
 *                 type: string
 *                 description: Proof document number
 *               # Basic Information
 *               hospitalName:
 *                 type: string
 *                 description: Name of the hospital/clinic
 *               hospitalType:
 *                 type: string
 *                 enum: [Hospital, Clinic, Consultant]
 *                 description: Type of healthcare facility
 *               registrationNumber:
 *                 type: string
 *                 description: Hospital registration number
 *               yearEstablished:
 *                 type: number
 *                 minimum: 1900
 *                 description: Year when hospital was established (optional)
 *               # Address Information
 *               address:
 *                 type: string
 *                 description: Street address
 *               city:
 *                 type: string
 *                 description: City name
 *               state:
 *                 type: string
 *                 description: State name
 *               pincode:
 *                 type: string
 *                 description: PIN code
 *               googleMapLink:
 *                 type: string
 *                 format: uri
 *                 description: Google Maps link (optional)
 *               # Contact Details
 *               phoneNumber:
 *                 type: string
 *                 description: Primary office phone number
 *               alternativePhone:
 *                 type: string
 *                 description: Alternative phone number (optional)
 *               emailAddress:
 *                 type: string
 *                 format: email
 *                 description: Hospital email address (optional)
 *               # Operation Details
 *               workingDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                 description: Days when hospital is open
 *               startTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Opening time (HH:MM format, required if not openAlways)
 *               endTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Closing time (HH:MM format, required if not openAlways)
 *               openAlways:
 *                 type: boolean
 *                 default: false
 *                 description: Whether hospital is open 24/7
 *               maxTokenPerDay:
 *                 type: number
 *                 minimum: 1
 *                 description: Maximum tokens per day (required if not unlimitedToken)
 *               unlimitedToken:
 *                 type: boolean
 *                 default: false
 *                 description: Whether tokens are unlimited
 *     responses:
 *       200:
 *         description: Onboarding information updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.put('/onboarding', authenticateAdmin, updateOnboardingInfo);

/**
 * @swagger
 * /api/admin/hospital-documents:
 *   put:
 *     summary: Upload hospital document
 *     tags: [Admin Documents]
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
 *               - documentType
 *               - file
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Admin ID (e.g., A0001)
 *               documentType:
 *                 type: string
 *                 enum: [registrationCertificate, accreditation, logo, hospitalImages]
 *                 description: Type of document to upload
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (JPEG, PNG, PDF - max 5MB)
 *     responses:
 *       200:
 *         description: Hospital document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 document:
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
 *         description: Bad request - missing fields or invalid file
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin or hospital not found
 *       413:
 *         description: File too large
 *       415:
 *         description: Unsupported media type
 *       500:
 *         description: Internal server error
 */
router.put('/hospital-documents',
    authenticateAdmin,
    uploadMiddleware.single('file'),
    multerErrorHandler,
    updateHospitalDocuments
);

/**
 * @swagger
 * /api/admin/owner-documents:
 *   put:
 *     summary: Upload owner document
 *     tags: [Admin Documents]
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
 *               - documentType
 *               - file
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Admin ID (e.g., A0001)
 *               documentType:
 *                 type: string
 *                 enum: [aadharCard, panCard]
 *                 description: Type of document to upload
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (JPEG, PNG, PDF - max 5MB)
 *     responses:
 *       200:
 *         description: Owner document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 document:
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
 *         description: Bad request - missing fields or invalid file
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       413:
 *         description: File too large
 *       415:
 *         description: Unsupported media type
 *       500:
 *         description: Internal server error
 */
router.put('/owner-documents',
    authenticateAdmin,
    uploadMiddleware.single('file'),
    multerErrorHandler,
    updateOwnerDocuments
);

/**
 * @swagger
 * /api/admin/{adminId}:
 *   get:
 *     summary: Get admin details by admin ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin details retrieved successfully
 *       404:
 *         description: Admin not found
 */
router.get('/:adminId', authenticateAdmin, getAdminDetails);

/**
 * @swagger
 * /api/admin/dashboard:
 *   post:
 *     summary: Get admin dashboard data
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Admin ID (e.g., A0001)
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       400:
 *         description: Bad request - missing adminId
 *       404:
 *         description: Admin not found
 */
router.post('/dashboard', authenticateAdmin, getAdminDashboard);

/**
 * @swagger
 * /api/admin/owner-info:
 *   put:
 *     summary: Update owner information
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - name
 *               - mobile
 *               - proof
 *               - proofNumber
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Admin ID (e.g., A0001)
 *               name:
 *                 type: string
 *                 description: Owner name
 *               mobile:
 *                 type: string
 *                 description: Owner mobile number
 *               proof:
 *                 type: string
 *                 enum: [Aadhar, PAN, Driving License, Passport]
 *                 description: Type of proof document
 *               proofNumber:
 *                 type: string
 *                 description: Proof document number
 *     responses:
 *       200:
 *         description: Owner information updated successfully
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: Admin not found
 */
router.put('/owner-info', authenticateAdmin, updateOwnerInfo);

/**
 * @swagger
 * /api/admin/hospital/basic-info:
 *   put:
 *     summary: Update hospital basic information
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - name
 *               - hospitalType
 *               - registrationNumber
 *               - yearEstablished
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Admin ID (e.g., A0001)
 *               name:
 *                 type: string
 *                 description: Hospital name
 *               hospitalType:
 *                 type: string
 *                 enum: [Hospital, Clinic, Consultant]
 *                 description: Type of hospital
 *               registrationNumber:
 *                 type: string
 *                 description: Hospital registration number
 *               yearEstablished:
 *                 type: number
 *                 description: Year hospital was established
 *               googleMapLink:
 *                 type: string
 *                 description: Google Maps link (optional)
 *     responses:
 *       200:
 *         description: Hospital basic information updated successfully
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: Admin or hospital not found
 */
router.put('/hospital/basic-info', authenticateAdmin, updateHospitalBasicInfo);

export default router;
