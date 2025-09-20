import express from 'express';
import { signup, login } from '../../controller/commonAuth.js';

const router = express.Router();

// Common authentication routes for both doctors and nurses
router.post('/signup', signup);
router.post('/login', login);

export default router;
