import express from 'express';
import { setDelay, getDelays, clearDelays, resetAvailability, getAdjustedTime, getDoctorsWithDelaysByHospital, cleanupExpiredDelays } from '../../controller/doctorDelayController.js';
import { orchestratorRateLimit } from '../../notificationOrchestrator/middleware/rateLimit.js';

const router = express.Router();

/**
 * @swagger
 * /api/doctor/delay:
 *   post:
 *     summary: Set a delay for a doctor
 *     description: Set a delay that affects all appointments from startTime onwards
 *     tags: [Doctor Delay Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - date
 *               - startTime
 *               - durationMinutes
 *               - reason
 *             properties:
 *               doctorId:
 *                 type: string
 *                 example: "D0001"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-22"
 *               startTime:
 *                 type: string
 *                 pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 example: "11:00"
 *               durationMinutes:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 480
 *                 example: 45
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Emergency surgery"
 *     responses:
 *       200:
 *         description: Delay set successfully
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
 *                   example: "Delay set successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     delay:
 *                       type: object
 *                     affectedAppointments:
 *                       type: number
 *                       example: 8
 *                     message:
 *                       type: string
 */
router.post('/delay', orchestratorRateLimit, setDelay);

/**
 * @swagger
 * /api/doctor/delay/{doctorId}:
 *   get:
 *     summary: Get active delays for a doctor
 *     description: Retrieve all active delays for a specific doctor
 *     tags: [Doctor Delay Management]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         example: "D0001"
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-22"
 *     responses:
 *       200:
 *         description: Delays retrieved successfully
 */
router.get('/delay/:doctorId', orchestratorRateLimit, getDelays);

/**
 * @swagger
 * /api/doctor/delay/{doctorId}:
 *   delete:
 *     summary: Clear delays for a doctor
 *     description: Clear all active delays for a doctor (optionally for specific date)
 *     tags: [Doctor Delay Management]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         example: "D0001"
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-22"
 *     responses:
 *       200:
 *         description: Delays cleared successfully
 */
router.delete('/delay/:doctorId', orchestratorRateLimit, clearDelays);

/**
 * @swagger
 * /api/doctor/reset-availability:
 *   post:
 *     summary: Reset all doctor availability (end of day)
 *     description: Clear all active delays for all doctors or specific doctor
 *     tags: [Doctor Delay Management]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId:
 *                 type: string
 *                 description: Optional specific doctor ID, if not provided resets all doctors
 *                 example: "D0001"
 *     responses:
 *       200:
 *         description: Availability reset successfully
 */
router.post('/reset-availability', orchestratorRateLimit, resetAvailability);

/**
 * @swagger
 * /api/doctor/adjusted-time:
 *   post:
 *     summary: Get adjusted appointment time considering delays
 *     description: Calculate the actual appointment time after applying all active delays
 *     tags: [Doctor Delay Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - appointmentDate
 *               - originalTime
 *             properties:
 *               doctorId:
 *                 type: string
 *                 example: "D0001"
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-22"
 *               originalTime:
 *                 type: string
 *                 example: "14:00"
 *     responses:
 *       200:
 *         description: Adjusted time calculated successfully
 */
router.post('/adjusted-time', orchestratorRateLimit, getAdjustedTime);

/**
 * @swagger
 * /api/doctor/delays/hospital/{hospitalId}:
 *   get:
 *     summary: Get all doctors with active delays in a hospital
 *     description: Retrieve all doctors in a hospital who have active delays for a specific date
 *     tags: [Doctor Delay Management]
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         example: "H0002"
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-22"
 *     responses:
 *       200:
 *         description: Doctors with delays retrieved successfully
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
 *                   example: "Doctors with delays retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     hospitalId:
 *                       type: string
 *                       example: "H0002"
 *                     date:
 *                       type: string
 *                       example: "2024-01-22"
 *                     doctorsWithDelays:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           doctorId:
 *                             type: string
 *                             example: "D0001"
 *                           name:
 *                             type: string
 *                             example: "Dr. John Smith"
 *                           email:
 *                             type: string
 *                             example: "john.smith@hospital.com"
 *                           delays:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 startTime:
 *                                   type: string
 *                                   example: "11:00"
 *                                 durationMinutes:
 *                                   type: number
 *                                   example: 45
 *                                 reason:
 *                                   type: string
 *                                   example: "Emergency surgery"
 *                                 isActive:
 *                                   type: boolean
 *                                   example: true
 *                                 createdAt:
 *                                   type: string
 *                                   format: date-time
 *                                 createdBy:
 *                                   type: string
 *                                   example: "A0001"
 *                     totalDoctorsWithDelays:
 *                       type: number
 *                       example: 2
 */
router.get('/delays/hospital/:hospitalId', orchestratorRateLimit, getDoctorsWithDelaysByHospital);

/**
 * @swagger
 * /api/doctor/delays/cleanup:
 *   post:
 *     summary: Manually cleanup expired delays
 *     description: Manually trigger cleanup of all expired delays across all doctors
 *     tags: [Doctor Delay Management]
 *     responses:
 *       200:
 *         description: Expired delays cleaned up successfully
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
 *                   example: "Expired delays cleaned up successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     totalDelaysCleaned:
 *                       type: number
 *                       example: 5
 *                     doctorsAffected:
 *                       type: number
 *                       example: 3
 *                     cleanupResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           doctorId:
 *                             type: string
 *                             example: "D0001"
 *                           name:
 *                             type: string
 *                             example: "Dr. John Smith"
 *                           delaysCleaned:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 startTime:
 *                                   type: string
 *                                   example: "11:00"
 *                                 durationMinutes:
 *                                   type: number
 *                                   example: 45
 *                                 reason:
 *                                   type: string
 *                                   example: "Emergency surgery"
 *                                 expiredAt:
 *                                   type: string
 *                                   format: date-time
 *                     cleanupTime:
 *                       type: string
 *                       format: date-time
 */
router.post('/delays/cleanup', orchestratorRateLimit, cleanupExpiredDelays);

export default router;
