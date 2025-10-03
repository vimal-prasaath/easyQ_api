import express from 'express';
import { getUserAppointments } from '../controller/userAppointments.js';

const router = express.Router();

// Open API endpoint - no authentication required
router.get('/user/:userId/appointments', getUserAppointments);

export default router;
