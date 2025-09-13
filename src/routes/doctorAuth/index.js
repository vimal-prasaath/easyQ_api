import express from 'express';
import { doctorSignup, doctorLogin, getDoctorProfile } from '../../controller/doctorAuth.js';
import { authenticateDoctor } from '../../middleware/doctorAuth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', doctorSignup);
router.post('/login', doctorLogin);

// Protected routes (authentication required)
router.get('/profile', authenticateDoctor, getDoctorProfile);

export default router;
