import express from 'express'
import {createAppointment , updateAppointment , deleteAppointment,
   processAppointment ,getAppointmentsByDoctor , getAppointmentById , getAppointmentsByHospital , getAppointmentsByPatient} from "../../controller/appointment.js"
const router = express.Router()
import authorizeOwnerOrAdmin from '../../middleware/adminOwnerOrAdmin.js'
import authorizeRoles from '../../middleware/authorization.js'
/**
 * @swagger
 * /api/appointment:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/',authorizeOwnerOrAdmin, createAppointment)

/**
 * @swagger
 * /api/process:
 *   post:
 *     summary: Get all appointments for a doctor
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 */
router.post('/process', authorizeRoles, processAppointment);
/**
 * @swagger
 * /api/appointment/{appointmentId}:
 *   put:
 *     summary: Update an appointment
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 * 
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 * 
 *   get:
 *     summary: Get an appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
router.put('/:appointmentId',authorizeOwnerOrAdmin, updateAppointment)
router.delete('/:appointmentId',authorizeOwnerOrAdmin, deleteAppointment)
router.get('/:appointmentId',authorizeOwnerOrAdmin, getAppointmentById)

/**
 * @swagger
 * /api/appointment/doctor/{doctorId}:
 *   get:
 *     summary: Get all appointments for a doctor
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 */
router.get('/doctor/:doctorId',authorizeRoles, getAppointmentsByDoctor)

/**
 * @swagger
 * /api/appointment/hospital/{hospitalId}:
 *   get:
 *     summary: Get all appointments for a hospital
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hospital not found
 */
router.get('/hospital/:hospitalId',authorizeRoles, getAppointmentsByHospital)

/**
 * @swagger
 * /api/userId/{patientId}:
 *   get:
 *     summary: Get all appointments for a doctor
 *     tags: [Appointments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 */

router.get('/userId/:patientId',authorizeOwnerOrAdmin,getAppointmentsByPatient)



export default router