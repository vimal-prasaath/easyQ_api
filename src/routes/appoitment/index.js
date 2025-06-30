import express from 'express'
import {createAppointment , updateAppointment , deleteAppointment
    ,getAllAppointmentOfDoctor , getAppointment , getAllAppointmentOfHospital} from "../../controller/appointment/index.js"
const router=express.Router()

router.post('/',createAppointment)
router.put('/:appointmentId',updateAppointment)

router.delete('/:appointmentId',deleteAppointment)

router.get('/:appointmentId',getAppointment)
router.get('/doctor/:doctorId',getAllAppointmentOfDoctor)
router.get('/hospital/:hospitalId',getAllAppointmentOfHospital)


export default router