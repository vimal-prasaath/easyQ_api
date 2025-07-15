import { AppointmentService } from '../services/appointmentService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logApiRequest, logApiResponse } from '../config/logger.js';
import { constructResponse,ResponseFormatter } from '../util/responseFormatter.js';

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
//not relavent to get all appointments 
// export async function getAllAppointments(req, res, next) {
//     // Log API request
//     logApiRequest(req, { action: 'get_all_appointments' });

//     try {
//         const appointments = await AppointmentService.getAllAppointments();
        
//         const response = constructResponse(
//             true,
//             httpStatusCode.OK,
//             'All appointments retrieved successfully',
//             appointments
//         );

//         // Log API response
//         logApiResponse(req, response);
        
//         res.status(httpStatusCode.OK).json(response);
//     } catch (error) {
//         next(error);
//     }
// }

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




export async function processAppointment(req, res, next) {
    const { appointmentId, paymentDetails } = req.body;
    const admin = req.headers['x-user-id']; 

    logApiRequest(req, { action: 'process_appointment', appointmentId, admin, paymentDetails });

    try {
        if (!appointmentId || !paymentDetails || typeof paymentDetails !== 'object' || Object.keys(paymentDetails).length === 0) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Appointment ID and valid payment details are required.'
            ));
        }

        const processedAppointment = await AppointmentService.processAppointment(appointmentId, admin, paymentDetails);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Appointment processed and status updated successfully",
            data: processedAppointment,
            statusCode: httpStatusCode.OK
        });
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}


