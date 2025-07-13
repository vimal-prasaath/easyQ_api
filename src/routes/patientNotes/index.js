import express from 'express';
import {
    createPatientNote,
    getPatientNotesByDoctor,
    getPatientNotesByPatient,
    updatePatientNote,
    deletePatientNote
} from '../../controller/patientNotes.js';

const router = express.Router();

router.post('/', createPatientNote);
router.get('/doctor/:doctorId', getPatientNotesByDoctor);
router.get('/patient/:patientId', getPatientNotesByPatient);
router.put('/:noteId', updatePatientNote);
router.delete('/:noteId', deletePatientNote);

export default router;