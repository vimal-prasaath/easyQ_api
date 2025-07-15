import express from 'express';
import {
    createPatientNote,
    getPatientNotesByDoctor,
    getPatientNotesByPatient,
    updatePatientNote,
    deletePatientNote
} from '../../controller/patientNotes.js';
import authorizeRoles from "../../middleware/authorization.js";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
const router = express.Router();

router.post('/',authorizeRoles, createPatientNote);
router.get('/doctor/:doctorId',authorizeOwnerOrAdmin, getPatientNotesByDoctor);
router.get('/patient/:patientId', authorizeOwnerOrAdmin, getPatientNotesByPatient);
router.put('/:noteId',authorizeRoles, updatePatientNote);
router.delete('/:noteId',authorizeRoles, deletePatientNote);

export default router;