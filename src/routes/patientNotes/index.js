/**
 * @swagger
 * /api/patient-notes:
 *   post:
 *     summary: Create a new patient note
 *     tags: [PatientNotes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - patientId
 *               - notes
 *               - visitType
 *             properties:
 *               doctorId:
 *                 type: string
 *               patientId:
 *                 type: string
 *               notes:
 *                 type: string
 *               visitType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient note created
 *       400:
 *         description: Invalid input data
 *
 * /api/patient-notes/doctor/{doctorId}:
 *   get:
 *     summary: Get patient notes by doctor ID
 *     tags: [PatientNotes]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of patient notes for the doctor
 *       404:
 *         description: Doctor not found
 *
 * /api/patient-notes/patient/{patientId}:
 *   get:
 *     summary: Get patient notes by patient ID
 *     tags: [PatientNotes]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of patient notes for the patient
 *       404:
 *         description: Patient not found
 *
 * /api/patient-notes/{noteId}:
 *   put:
 *     summary: Update a patient note
 *     tags: [PatientNotes]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *               visitType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient note updated
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Note not found
 *
 *   delete:
 *     summary: Delete a patient note
 *     tags: [PatientNotes]
 *     parameters:
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient note deleted
 *       404:
 *         description: Note not found
 */
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