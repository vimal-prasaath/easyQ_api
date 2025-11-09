import { AppointmentService } from '../services/appointmentService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logApiRequest, logApiResponse, logInfo, logError } from '../config/logger.js';
import { constructResponse,ResponseFormatter } from '../util/responseFormatter.js';
import { uploadAppointmentDocument, deleteFileFromFirebase, extractFilePathFromUrl } from '../config/fireBaseStorage.js';
import { calculateUserHospitalDistance, calculateApproximateTravelTime } from '../util/distanceCalculator.js';
import User from '../model/userProfile.js';

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
        
        // Add distance and travel time calculation for each appointment
        if (appointments && appointments.length > 0) {
            // Get user data for distance calculation
            const user = await User.findOne({ userId: patientId });
            
            if (user) {
                // Get unique hospital IDs to fetch hospital data
                const hospitalIds = [...new Set(appointments.map(apt => apt.hospitalId))];
                const Hospital = (await import('../model/hospital.js')).default;
                const hospitals = await Hospital.find({ hospitalId: { $in: hospitalIds } });
                const hospitalMap = {};
                hospitals.forEach(hospital => {
                    hospitalMap[hospital.hospitalId] = hospital;
                });

                // Add distance and travel time to each appointment
                await Promise.all(appointments.map(async appointment => {
                    const hospital = hospitalMap[appointment.hospitalId];
                    if (hospital) {
                        const distance = calculateUserHospitalDistance(user, hospital);
                        const approximateTime = await calculateApproximateTravelTime(user, hospital);
                        appointment.distance = distance; // Add distance to the appointment data
                        appointment.approximateTime = approximateTime; // Add travel time to the appointment data
                    }
                }));
            }
        }
        
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
        
        // Add distance calculation for each appointment
        if (appointments && appointments.length > 0) {
            // Get unique patient IDs to fetch user data
            const patientIds = [...new Set(appointments.map(apt => apt.patientId))];
            const users = await User.find({ userId: { $in: patientIds } });
            const userMap = {};
            users.forEach(user => {
                userMap[user.userId] = user;
            });

            // Get hospital data for distance calculation
            const Hospital = (await import('../model/hospital.js')).default;
            const hospital = await Hospital.findOne({ hospitalId });

            // Add distance and travel time to each appointment
            await Promise.all(appointments.map(async appointment => {
                const user = userMap[appointment.patientId];
                if (user && hospital) {
                    const distance = calculateUserHospitalDistance(user, hospital);
                    const approximateTime = await calculateApproximateTravelTime(user, hospital);
                    appointment.distance = distance; // Add distance to the appointment data
                    appointment.approximateTime = approximateTime; // Add travel time to the appointment data
                }
            }));
        }
        
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
        
        // Add distance calculation if appointment data is available
        if (appointment && appointment.length > 0) {
            const appointmentData = appointment[0];
            
            // Get user data for distance calculation
            const user = await User.findOne({ userId: appointmentData.patientId });
            
            // Fetch hospital data separately since hospitalInfo is removed in aggregation projection
            if (user && appointmentData.hospitalId) {
                const Hospital = (await import('../model/hospital.js')).default;
                const hospital = await Hospital.findOne({ hospitalId: appointmentData.hospitalId });
                
                if (hospital) {
                    const distance = calculateUserHospitalDistance(user, hospital);
                    const approximateTime = await calculateApproximateTravelTime(user, hospital);
                    appointmentData.distance = distance; // Add distance to the appointment data
                    appointmentData.approximateTime = approximateTime; // Add travel time to the appointment data
                }
            }
        }
        
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



export async function safeCreateAppointment(req, res, next) {
    const appointmentData = req.body;
    logApiRequest(req, { action: 'safe_create_appointment', data: appointmentData });

    try {
        const newAppointment = await AppointmentService.safeCreateAppointment(appointmentData);
        const response = constructResponse(
            true,
            httpStatusCode.CREATED,
            'Data fetched successfully.',
            newAppointment
        );

        logApiResponse(req, response);
        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        next(error);
    }
}

export async function uploadAppointmentDocuments(req, res, next) {
    const { appointmentId } = req.params;
    const files = req.files;
    console.log(appointmentId)
    // Log API request
    logApiRequest(req, { action: 'upload_appointment_documents', appointmentId, fileCount: files?.length });

    try {
        if (!appointmentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Appointment ID is required.'
            ));
        }

        if (!files || files.length === 0) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'No files uploaded.'
            ));
        }

        // Check if appointment exists and get patient ID
        const appointmentResult = await AppointmentService.getAppointmentById(appointmentId);
        if (!appointmentResult || appointmentResult.length === 0) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found.'
            ));
        }

        const appointment = appointmentResult[0]; // Get first element from aggregation result

        // Check if appointment is checked out (only allow document upload after checkout)
        if (appointment.checkInStatus !== 'Checked-out') {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Documents can only be uploaded after appointment checkout.'
            ));
        }

        const uploadedDocuments = [];
        const errors = [];

        // Upload each file
        for (const file of files) {
            try {
                const fileStorageInfo = await uploadAppointmentDocument(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    appointmentId,
                    appointment.patientId
                );

                uploadedDocuments.push({
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    fileUrl: fileStorageInfo.url,
                    filePath: fileStorageInfo.path,
                    uploadedAt: new Date()
                });
            } catch (uploadError) {
                console.error(`Failed to upload file ${file.originalname}:`, uploadError);
                errors.push({
                    fileName: file.originalname,
                    error: uploadError.message
                });
            }
        }

        if (uploadedDocuments.length === 0) {
            return next(new EasyQError(
                'UploadError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                'Failed to upload any documents.',
                { errors }
            ));
        }

        // Update appointment with new document URLs
        const currentReportUrls = appointment.reportUrls || [];
        const newReportUrls = uploadedDocuments.map(doc => doc.fileUrl);
        const updatedReportUrls = [...currentReportUrls, ...newReportUrls];

        const updatedAppointment = await AppointmentService.updateAppointment(appointmentId, {
            reportUrls: updatedReportUrls
        });

        const response = constructResponse(
            true,
            httpStatusCode.OK,
            `Successfully uploaded ${uploadedDocuments.length} document(s).`,
            {
                appointmentId,
                uploadedDocuments,
                totalDocuments: updatedReportUrls.length,
                errors: errors.length > 0 ? errors : undefined
            }
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function deleteAppointmentDocument(req, res, next) {
    const { appointmentId } = req.params;
    const { documentUrl } = req.body;
    
    // Log API request
    logApiRequest(req, { action: 'delete_appointment_document', appointmentId, documentUrl });

    try {
        if (!appointmentId || !documentUrl) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Appointment ID and document URL are required.'
            ));
        }

        // Check if appointment exists
        const appointmentResult = await AppointmentService.getAppointmentById(appointmentId);
        if (!appointmentResult || appointmentResult.length === 0) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found.'
            ));
        }

        const appointment = appointmentResult[0]; // Get first element from aggregation result

        // Check if document URL exists in reportUrls
        const currentReportUrls = appointment.reportUrls || [];
        if (!currentReportUrls.includes(documentUrl)) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Document not found in appointment.'
            ));
        }

        // Extract file path from URL and delete from Firebase
        const filePath = extractFilePathFromUrl(documentUrl);
        if (filePath) {
            try {
                await deleteFileFromFirebase(filePath);
                console.log(`Successfully deleted file from Firebase: ${filePath}`);
            } catch (firebaseError) {
                console.error(`Failed to delete file from Firebase: ${firebaseError.message}`);
                // Continue with database update even if Firebase deletion fails
            }
        }

        // Remove document URL from appointment
        const updatedReportUrls = currentReportUrls.filter(url => url !== documentUrl);
        const updatedAppointment = await AppointmentService.updateAppointment(appointmentId, {
            reportUrls: updatedReportUrls
        });

        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Document deleted successfully.',
            {
                appointmentId,
                deletedDocumentUrl: documentUrl,
                remainingDocuments: updatedReportUrls.length
            }
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function getAppointmentDocuments(req, res, next) {
    const { appointmentId } = req.params;
    
    // Log API request
    logApiRequest(req, { action: 'get_appointment_documents', appointmentId });

    try {
        if (!appointmentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Appointment ID is required.'
            ));
        }

        // Get appointment
        const appointmentResult = await AppointmentService.getAppointmentById(appointmentId);
        if (!appointmentResult || appointmentResult.length === 0) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Appointment not found.'
            ));
        }

        const appointment = appointmentResult[0]; // Get first element from aggregation result

        const reportUrls = appointment.reportUrls || [];
        
        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Appointment documents retrieved successfully.',
            {
                appointmentId,
                documents: reportUrls.map((url, index) => ({
                    documentId: index + 1,
                    documentUrl: url,
                    fileName: url.split('/').pop() || `document_${index + 1}`
                })),
                totalDocuments: reportUrls.length
            }
        );

        // Log API response
        logApiResponse(req, response);
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function getAppointmentsSummary(req, res, next) {
    console.log('🚀 getAppointmentsSummary function called');
    console.log('req.body', req.body);
    console.log('req.method', req.method);
    console.log('req.url', req.url);
    try {
        // Extract data from request body
        const { adminId, date } = req.body;
        
        // Validate mandatory adminId
        if (!adminId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'adminId is mandatory in request body.'
            ));
        }

        // Get hospitalId from hospital database using adminId
        const authenticatedAdminId = req.user?.data?.userId;
        let adminHospitalId = null;
        
        if (authenticatedAdminId) {
            // Get hospital from hospital database using adminId
            const Hospital = (await import('../model/hospital.js')).default;
            const hospital = await Hospital.findOne({ adminId: authenticatedAdminId });
            adminHospitalId = hospital?.hospitalId;
        }
        
        logInfo('Getting appointments summary', { 
            date: date || 'all dates',
            authenticatedAdminId: authenticatedAdminId,
            adminHospitalId: adminHospitalId
        });

        console.log({date})

        // Validate date format if provided
        if (date) {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return next(new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Invalid date format. Please use YYYY-MM-DD format.'
                ));
            }
        }
        
        const appointments = await AppointmentService.getAppointmentsSummary(date, adminHospitalId);

        const response = {
            success: true,
            message: 'Appointments summary retrieved successfully',
            data: {
                appointments,
                totalCount: appointments.length,
                date: date || 'all dates'
            }
        };

        logInfo('Appointments summary retrieved successfully', {
            count: appointments.length,
            date: date || 'all dates'
        });

        console.log('✅ Sending response with', appointments.length, 'appointments');
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError('Error getting appointments summary', {
            error: error.message,
            date: req.query.date
        });
        next(error);
    }
}
