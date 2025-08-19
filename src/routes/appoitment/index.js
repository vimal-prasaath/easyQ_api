import express from 'express'
import {createAppointment , updateAppointment , deleteAppointment,
   processAppointment ,getAppointmentsByDoctor , getAppointmentById , getAppointmentsByHospital , getAppointmentsByPatient} from "../../controller/appointment.js"
const router = express.Router()
import authorizeOwnerOrAdmin from '../../middleware/adminOwnerOrAdmin.js'
import authorizeRoles from '../../middleware/authorization.js'

router.post('/',authorizeOwnerOrAdmin, createAppointment)
router.post('/process', authorizeRoles, processAppointment);
router.put('/:appointmentId',authorizeOwnerOrAdmin, updateAppointment)
router.delete('/:appointmentId',authorizeOwnerOrAdmin, deleteAppointment)
router.get('/:appointmentId',authorizeOwnerOrAdmin, getAppointmentById)
router.get('/doctor/:doctorId',authorizeRoles, getAppointmentsByDoctor)
router.get('/hospital/:hospitalId',authorizeRoles, getAppointmentsByHospital)
router.get('/userId/:patientId',authorizeOwnerOrAdmin,getAppointmentsByPatient)

export default router