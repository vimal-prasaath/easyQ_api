
import Doctor from '../../model/doctor.js'; 
import Hospital from '../../model/hospital/index.js'; 
import User from '../../model/userProfile.js'; 

export const createValidation = async (data) => {
   
    if (!data.patientId || !data.doctorId || !data.hospitalId || !data.appointmentDate || !data.appointmentTime || !data.reasonForAppointment || !data.appointmentType || !data.paymentStatus) {
        return {
            isValid: false,
            statusCode: 400,
            message: 'Missing mandatory appointment fields.'
        };
    }

  
    try {
        const patientExists = await User.findOne({userId:data.patientId});
        if (!patientExists) {
            return {
                isValid: false,
                statusCode: 404,
                message: `Patient with ID ${data.patientId} not found.`
            };
        }
    } catch (error) {
        if (error.name === 'CastError' && error.path === '_id') {
            return {
                isValid: false,
                statusCode: 400,
                message: `Invalid patient ID format: ${data.patientId}.`
            };
        }
        console.error('Error validating patient existence:', error);
        return {
            isValid: false,
            statusCode: 500,
            message: 'An unexpected error occurred during patient validation.'
        };
    }


    try {
        const doctorExists = await Doctor.findOne({ doctorId: data.doctorId });
        if (!doctorExists) {
            return {
                isValid: false,
                statusCode: 404,
                message: `Doctor with ID ${data.doctorId} not found.`
            };
        }
    } catch (error) {
        console.error('Error validating doctor existence:', error);
        return {
            isValid: false,
            statusCode: 500,
            message: 'An unexpected error occurred during doctor validation.'
        };
    }


    try {
        const hospitalExists = await Hospital.findOne({ hospitalId: data.hospitalId });
        if (!hospitalExists) {
            return {
                isValid: false,
                statusCode: 404,
                message: `Hospital with ID ${data.hospitalId} not found.`
            };
        }
    } catch (error) {
        console.error('Error validating hospital existence:', error);
        return {
            isValid: false,
            statusCode: 500,
            message: 'An unexpected error occurred during hospital validation.'
        };
    }

    return {
        isValid: true
    };
};