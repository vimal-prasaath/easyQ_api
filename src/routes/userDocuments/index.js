import express from 'express';
import { getUserDocuments } from '../../controller/userDocumentsController.js';

const router = express.Router();

// Get user documents grouped by appointment ID
router.get('/documents/:userId', getUserDocuments);

export default router;
