import express from 'express'
import {createAppointment , updateAppointment , deleteAppointment,
   processAppointment ,getAppointmentsByDoctor , getAppointmentById , getAppointmentsByHospital , getAppointmentsByPatient,
   uploadAppointmentDocuments, deleteAppointmentDocument, getAppointmentDocuments} from "../../controller/appointment.js"
const router = express.Router()
import authorizeOwnerOrAdmin from '../../middleware/adminOwnerOrAdmin.js'
import authorizeRoles from '../../middleware/authorization.js'
import { uploadMultipleFilesMiddleware, busboyErrorHandler } from '../../config/fileConfig.js'

router.post('/',authorizeOwnerOrAdmin, createAppointment)
router.post('/process', authorizeRoles, processAppointment);
router.put('/:appointmentId',authorizeOwnerOrAdmin, updateAppointment)
router.delete('/:appointmentId',authorizeOwnerOrAdmin, deleteAppointment)
router.get('/:appointmentId',authorizeOwnerOrAdmin, getAppointmentById)
router.get('/doctor/:doctorId',authorizeRoles, getAppointmentsByDoctor)
router.get('/hospital/:hospitalId',authorizeRoles, getAppointmentsByHospital)
router.get('/userId/:patientId',authorizeOwnerOrAdmin,getAppointmentsByPatient)

// Document management routes
router.post('/:appointmentId/documents/upload', uploadMultipleFilesMiddleware, busboyErrorHandler, authorizeOwnerOrAdmin, uploadAppointmentDocuments)
router.delete('/:appointmentId/documents', authorizeOwnerOrAdmin, deleteAppointmentDocument)
router.get('/:appointmentId/documents', authorizeOwnerOrAdmin, getAppointmentDocuments)

export default router