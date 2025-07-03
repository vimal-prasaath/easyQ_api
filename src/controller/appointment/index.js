import Appointment from '../../model/appointment.js';
import { createValidation } from './validation.js';
import { constructPipeLine } from "./util.js"
import User from '../../model/userProfile.js';
import { google } from 'googleapis';
export async function createAppointment(req, res) {
  const data = req.body;

  try {
    const validationResult = await createValidation(data);

    if (!validationResult.isValid) {
      return res.status(400).json({ message: validationResult.message });
    }
    const newAppointment = await Appointment.create(data);
    const user = await User.findOne({ userId: data.patientId });
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const start = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
    const end = new Date(start.getTime() + 30 * 60000);
    const event = {
      summary: 'Appointment',
      start: { dateTime: start, timeZone: 'Asia/Kolkata' },
      end: { dateTime: end, timeZone: 'Asia/Kolkata' }
    };
    const calenderevent = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });

    res.status(200).json({
      message: 'Appointment booked and added to Google Calenda',
      appointment: newAppointment
    });

  } catch (error) {
    console.error('Error creating appointment:', error);
  }
}



export async function deleteAppointment(req, res) {
  const { appointmentId } = req.params
  try {
    const appointment = await Appointment.findOneAndDelete({ appointmentId: appointmentId })
    res.status(200).json({ message: "appointment Deleted succesfully" })

  } catch (e) {
    console.log(e)
  }
}
export async function getAppointment(req, res) {
  const { appointmentId } = req.params
  try {
    const appointment = await Appointment.findOne({ appointmentId: appointmentId })
    res.status(200).json({ message: "appointment fetched succesfully", appointment: appointment })

  } catch (e) {
    console.log(e)
  }
}

export async function getAllAppointmentOfDoctor(req, res) {
  const { doctorId } = req.params
  try {
    const appointment = await Appointment.find({ doctorId: doctorId })
    res.status(200).json({ message: "appointment fetched succesfully", appointment: appointment })

  } catch (e) {
    console.log(e)
  }
}

export async function getAllAppointmentOfHospital(req, res) {
  const { hospitalId } = req.params
 
  try {
    const appointment = await Appointment.find({ hospitalId: hospitalId })
    res.status(200).json({ message: "appointment fetched succesfully", appointment: appointment })

  } catch (e) {
    console.log(e)
  }
}



export async function updateAppointment(req, res) {
  const { appointmentId } = req.params;
  const updates = req.body;
  const pipeline = constructPipeLine(updates)
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

export async function getAllAppointmentOfUser(req, res) {
  const { patientId } = req.params;
  try {
 const appointment = await Appointment.findOne({patientId:patientId})
 res.status(200).json({data:appointment})
  } catch (e) {
   console.log(e)
  }
} 