import express from 'express';
import { uploadAppointmentDocumentsOpen, deleteAppointmentDocumentOpen } from '../../controller/appointment.js';
import { uploadMultipleFilesMiddleware, busboyErrorHandler } from '../../config/fileConfig.js';

const router = express.Router();

// Open API - Upload appointment documents (User side)
// POST /api/appointment/:appointmentId/documents/upload
router.post('/:appointmentId/documents/upload', uploadMultipleFilesMiddleware, busboyErrorHandler, uploadAppointmentDocumentsOpen);

// Open API - Delete appointment document (User side)
// DELETE /api/appointment/:appointmentId/documents
router.delete('/:appointmentId/documents', deleteAppointmentDocumentOpen);

export default router;

