import express from 'express';
import { createFollowUpAppointment, getFollowUpAppointmentsByPatient, getFollowUpAppointmentsByDoctor, getFollowUpAppointmentsByHospital, getFollowUpAppointmentsByCreator } from '../../controller/followUpAppointmentController.js';
import { orchestratorRateLimit } from '../../notificationOrchestrator/middleware/rateLimit.js';

const router = express.Router();

/**
 * @swagger
 * /api/appointment/follow-up:
 *   post:
 *     summary: Create a follow-up appointment
 *     description: Create a follow-up appointment for a patient after checkout. Automatically sends notification to patient.
 *     tags: [Follow-up Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorId
 *               - hospitalId
 *               - appointmentDate
 *               - appointmentTime
 *               - followUpReason
 *               - createdBy
 *               - createdById
 *               - parentAppointmentId
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "P0001"
 *               doctorId:
 *                 type: string
 *                 example: "D0001"
 *               hospitalId:
 *                 type: string
 *                 example: "H0002"
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-29"
 *               appointmentTime:
 *                 type: string
 *                 example: "10:00"
 *               followUpReason:
 *                 type: string
 *                 example: "Blood test results review"
 *               createdBy:
 *                 type: string
 *                 enum: [admin, doctor, nurse]
 *                 example: "doctor"
 *               createdById:
 *                 type: string
 *                 example: "D0001"
 *               parentAppointmentId:
 *                 type: string
 *                 example: "APT001"
 *               consultationType:
 *                 type: string
 *                 example: "Follow-up"
 *               notes:
 *                 type: string
 *                 example: "Follow-up for blood test results"
 *     responses:
 *       201:
 *         description: Follow-up appointment created successfully
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
 *                   example: "Follow-up appointment created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointmentId:
 *                       type: string
 *                       example: "APT002"
 *                     patientId:
 *                       type: string
 *                       example: "P0001"
 *                     doctorId:
 *                       type: string
 *                       example: "D0001"
 *                     hospitalId:
 *                       type: string
 *                       example: "H0002"
 *                     appointmentDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-29T00:00:00.000Z"
 *                     appointmentTime:
 *                       type: string
 *                       example: "10:00"
 *                     status:
 *                       type: string
 *                       example: "Scheduled"
 *                     tokenDisplay:
 *                       type: string
 *                       example: "S1T002"
 *                     followUp:
 *                       type: object
 *                       properties:
 *                         isFollowUp:
 *                           type: boolean
 *                           example: true
 *                         parentAppointmentId:
 *                           type: string
 *                           example: "APT001"
 *                         followUpReason:
 *                           type: string
 *                           example: "Blood test results review"
 *                         createdBy:
 *                           type: string
 *                           example: "doctor"
 *                         createdById:
 *                           type: string
 *                           example: "D0001"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 */
router.post('/', orchestratorRateLimit, createFollowUpAppointment);

/**
 * @swagger
 * /api/appointment/follow-up/patient/{patientId}:
 *   get:
 *     summary: Get follow-up appointments for a patient
 *     description: Retrieve all follow-up appointments for a specific patient
 *     tags: [Follow-up Appointments]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         example: "P0001"
 *     responses:
 *       200:
 *         description: Follow-up appointments retrieved successfully
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
 *                   example: "Follow-up appointments retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     patientId:
 *                       type: string
 *                       example: "P0001"
 *                     followUpAppointments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           appointmentId:
 *                             type: string
 *                             example: "APT002"
 *                           patientId:
 *                             type: string
 *                             example: "P0001"
 *                           doctorId:
 *                             type: string
 *                             example: "D0001"
 *                           appointmentDate:
 *                             type: string
 *                             format: date
 *                             example: "2024-01-29T00:00:00.000Z"
 *                           appointmentTime:
 *                             type: string
 *                             example: "10:00"
 *                           status:
 *                             type: string
 *                             example: "Scheduled"
 *                           followUp:
 *                             type: object
 *                             properties:
 *                               isFollowUp:
 *                                 type: boolean
 *                                 example: true
 *                               parentAppointmentId:
 *                                 type: string
 *                                 example: "APT001"
 *                               followUpReason:
 *                                 type: string
 *                                 example: "Blood test results review"
 *                               createdBy:
 *                                 type: string
 *                                 example: "doctor"
 *                               createdById:
 *                                 type: string
 *                                 example: "D0001"
 *                     totalFollowUps:
 *                       type: number
 *                       example: 2
 */
router.get('/patient/:patientId', orchestratorRateLimit, getFollowUpAppointmentsByPatient);

/**
 * @swagger
 * /api/appointment/follow-up/doctor/{doctorId}:
 *   get:
 *     summary: Get follow-up appointments for a doctor
 *     description: Retrieve all follow-up appointments for a specific doctor
 *     tags: [Follow-up Appointments]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         example: "D0001"
 *     responses:
 *       200:
 *         description: Follow-up appointments retrieved successfully
 */
router.get('/doctor/:doctorId', orchestratorRateLimit, getFollowUpAppointmentsByDoctor);

/**
 * @swagger
 * /api/appointment/follow-up/hospital/{hospitalId}:
 *   get:
 *     summary: Get follow-up appointments for a hospital
 *     description: Retrieve all follow-up appointments for a specific hospital
 *     tags: [Follow-up Appointments]
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         example: "H0002"
 *     responses:
 *       200:
 *         description: Follow-up appointments retrieved successfully
 */
router.get('/hospital/:hospitalId', orchestratorRateLimit, getFollowUpAppointmentsByHospital);

/**
 * @swagger
 * /api/appointment/follow-up/creator/{createdBy}/{createdById}:
 *   get:
 *     summary: Get follow-up appointments created by a specific user
 *     description: Retrieve all follow-up appointments created by a specific admin, doctor, or nurse
 *     tags: [Follow-up Appointments]
 *     parameters:
 *       - in: path
 *         name: createdBy
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, doctor, nurse]
 *         example: "doctor"
 *       - in: path
 *         name: createdById
 *         required: true
 *         schema:
 *           type: string
 *         example: "D0001"
 *     responses:
 *       200:
 *         description: Follow-up appointments retrieved successfully
 */
router.get('/creator/:createdBy/:createdById', orchestratorRateLimit, getFollowUpAppointmentsByCreator);

export default router;
