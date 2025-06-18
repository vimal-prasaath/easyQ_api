import Appointment from '../../model/appointment.js';
import { createValidation } from './validation.js';
import {constructPipeLine} from "./util.js"

export async function createAppointment(req, res) {
    const data = req.body;
 
    try {
         const validationResult = await createValidation(data); 

        if (!validationResult.isValid) {
            return res.status(validationResult.statusCode).json({ message: validationResult.message });
        }
        const newAppointment = await Appointment.create(data);

        res.status(201).json({
            message: 'Appointment created successfully',
            appointment: newAppointment
        });

    } catch (error) {
        console.error('Error creating appointment:', error);
    }
}



export async function deleteAppointment(req,res){
   const {appointmentId}=req.params
  try{
    const appointment=await Appointment.findOneAndDelete({appointmentId:appointmentId})
    res.status(200).json({message:"appointment Deleted succesfully"})

  }catch(e){
    console.log(e)
  }
}
export async function getAppointment(req,res){
    const {appointmentId}=req.params
  try{
    const appointment=await Appointment.findOne({appointmentId:appointmentId})
    res.status(200).json({message:"appointment fetched succesfully", appointment:appointment})

  }catch(e){
    console.log(e)
  }
}

export async function getAllAppointmentOfDoctor(req,res){
      const {doctorId}=req.params
 try{
    const appointment=await Appointment.find({doctorId:doctorId})
    res.status(200).json({message:"appointment fetched succesfully",appointment:appointment})

  }catch(e){
    console.log(e)
  }
}

export async function getAllAppointmentOfHospital(req,res){
 const {hospitalId}=req.params
 console.log(hospitalId,"LLL")
 try{
    const appointment=await Appointment.find({hospitalId:hospitalId})
    res.status(200).json({message:"appointment fetched succesfully",appointment:appointment})

  }catch(e){
    console.log(e)
  }
}



export async function updateAppointment(req, res) {
    const  {appointmentId}  = req.params;
    console.log(appointmentId,"32200")
    const updates = req.body;
    const pipeline=constructPipeLine(updates)
    const updatedAppointment = await Appointment.findOneAndUpdate(
        { appointmentId: appointmentId },
        pipeline,
        {
            new: true,
            runValidators: true,
            context: 'query'
        }
    );

    if (!updatedAppointment) {
        return res.status(404).json({ message: `Appointment with ID '${appointmentId}' not found.` });
    }

    res.status(200).json({
        message: 'Appointment information updated successfully',
        appointment: updatedAppointment
    });
}