import { AppointmentService } from '../services/appointmentService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logApiRequest, logApiResponse } from '../config/logger.js';
import { constructResponse } from '../util/responseFormatter.js';

export async function createAppointment(req, res, next) {
    const data = req.body;
    
    // Log API request
    logApiRequest(req, { action: 'create_appointment', data });

    try {
        const newAppointment = await AppointmentService.createAppointment(data);
        
        const response = constructResponse(
            true,
            httpStatusCode.CREATED,
            'Appointment created successfully',
            newAppointment
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        next(error);
    }
}

export async function getAppointmentsByPatient(req, res, next) {
    const { patientId } = req.params;
    
    // Log API request
    logApiRequest(req, { action: 'get_patient_appointments', patientId });

    try {
        const appointments = await AppointmentService.getAppointmentsByPatient(patientId);
        
        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Patient appointments retrieved successfully',
            appointments
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function getAppointmentsByDoctor(req, res, next) {
    const { doctorId } = req.params;
    
    // Log API request
    logApiRequest(req, { action: 'get_doctor_appointments', doctorId });

    try {
        const appointments = await AppointmentService.getAppointmentsByDoctor(doctorId);
        
        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Doctor appointments retrieved successfully',
            appointments
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function getAppointmentsByHospital(req, res, next) {
    const { hospitalId } = req.params;
    
    // Log API request
    logApiRequest(req, { action: 'get_hospital_appointments', hospitalId });

    try {
        const appointments = await AppointmentService.getAppointmentsByHospital(hospitalId);
        
        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Hospital appointments retrieved successfully',
            appointments
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function getAllAppointments(req, res, next) {
    // Log API request
    logApiRequest(req, { action: 'get_all_appointments' });

    try {
        const appointments = await AppointmentService.getAllAppointments();
        
        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'All appointments retrieved successfully',
            appointments
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function updateAppointment(req, res, next) {
    const { appointmentId } = req.params;
    const updateData = req.body;
    
    // Log API request
    logApiRequest(req, { action: 'update_appointment', appointmentId, updateData });

    try {
        const updatedAppointment = await AppointmentService.updateAppointment(appointmentId, updateData);
        
        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Appointment updated successfully',
            updatedAppointment
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function deleteAppointment(req, res, next) {
    const { appointmentId } = req.params;
    
    // Log API request
    logApiRequest(req, { action: 'delete_appointment', appointmentId });

    try {
        const deletedAppointment = await AppointmentService.deleteAppointment(appointmentId);
        
        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Appointment deleted successfully',
            deletedAppointment
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function getAppointmentById(req, res, next) {
    const { appointmentId } = req.params;
    
    // Log API request
    logApiRequest(req, { action: 'get_appointment_by_id', appointmentId });

    try {
        const appointment = await AppointmentService.getAppointmentById(appointmentId);
        
        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Appointment retrieved successfully',
            appointment
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}


export async function getAppointment(req, res , next) {
  const { appointmentId } = req.params;
    try {
        if (!appointmentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Appointment ID is required.'
            ));
        }
        const appointment = await Appointment.findOne({ appointmentId: appointmentId });
        if (!appointment) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found.'
            ));
        }
        res.status(httpStatusCode.OK).json({ message: "Appointment fetched successfully", appointment: appointment });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Appointment ID format: ${appointmentId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch appointment: ${error.message}`
        ));
    }
}

export async function getAllAppointmentOfDoctor(req, res ,next) {
 const { doctorId } = req.params;
    try {
        if (!doctorId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required.'
            ));
        }
        const appointments = await Appointment.find({ doctorId: doctorId });
        res.status(httpStatusCode.OK).json({ message: "Appointments fetched successfully", appointments: appointments });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Doctor ID format: ${doctorId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch doctor's appointments: ${error.message}`
        ));
    }
}

export async function getAllAppointmentOfHospital(req, res ,next) {
  const { hospitalId } = req.params;
    try {
        if (!hospitalId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required.'
            ));
        }
        const appointments = await Appointment.find({ hospitalId: hospitalId });
        res.status(httpStatusCode.OK).json({ message: "Appointments fetched successfully", appointments: appointments });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Hospital ID format: ${hospitalId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch hospital's appointments: ${error.message}`
        ));
    }
}





export async function getAllAppointmentOfUser(req, res ,next) {
  const { patientId } = req.params;
    try {
        if (!patientId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Patient ID is required.'
            ));
        }
        const appointment = await Appointment.find({ patientId: patientId });
        res.status(httpStatusCode.OK).json({ data: appointment });
    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Patient ID format: ${patientId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch user's appointments: ${error.message}`
        ));
    }
} 



