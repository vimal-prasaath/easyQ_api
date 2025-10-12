import express from 'express';
import { migrateTokens, getTokenStats } from '../../controller/tokenMigrationController.js';
import { orchestratorRateLimit } from '../../notificationOrchestrator/middleware/rateLimit.js';

const router = express.Router();

/**
 * @swagger
 * /api/token/migrate:
 *   post:
 *     summary: Migrate existing appointments to add token numbers
 *     description: Add token numbers to appointments that don't have them yet
 *     tags: [Token Management]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId:
 *                 type: string
 *                 description: Optional doctor ID to limit migration to specific doctor
 *                 example: "D0001"
 *     responses:
 *       200:
 *         description: Migration completed successfully
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
 *                   example: "Token migration completed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     migrated:
 *                       type: number
 *                       example: 25
 *                     errors:
 *                       type: number
 *                       example: 0
 *                     total:
 *                       type: number
 *                       example: 25
 */
router.post('/migrate', orchestratorRateLimit, migrateTokens);

/**
 * @swagger
 * /api/token/stats/{doctorId}:
 *   get:
 *     summary: Get token statistics for a doctor
 *     description: Retrieve token usage statistics for a specific doctor
 *     tags: [Token Management]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Doctor ID
 *         example: "D0001"
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *         description: Specific date (YYYY-MM-DD) or 'all' for all dates
 *         example: "2024-01-22"
 *     responses:
 *       200:
 *         description: Token statistics retrieved successfully
 */
router.get('/stats/:doctorId', orchestratorRateLimit, getTokenStats);

export default router;
