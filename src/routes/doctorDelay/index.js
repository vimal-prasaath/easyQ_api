import express from 'express';
import { setDelay, getDelays, clearDelays, resetAvailability, getAdjustedTime } from '../../controller/doctorDelayController.js';
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

export default router;
