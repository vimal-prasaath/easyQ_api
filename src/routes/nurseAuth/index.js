import express from 'express';
import { nurseSignup, nurseLogin, getNurseProfile } from '../../controller/nurseAuth.js';
import { authenticateNurse } from '../../middleware/nurseAuth.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', nurseSignup);
router.post('/login', nurseLogin);

// Protected routes (authentication required)
router.get('/profile', authenticateNurse, getNurseProfile);

export default router;
