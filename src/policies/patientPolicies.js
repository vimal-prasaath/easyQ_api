import Appointment from "../model/appointment.js";
import Review from "../model/review.js"
const patientPolicies = {
    //profile policy 
    'profile': {
        'read': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        },
        'update': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        },
        'delete': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        }
    },
    //Admin policy 
    'admin': {
        'read_all': false,
        'read_inactive_users': false,
        'activate': false,
        'delete': false
    },
    //Hospital policy 
    'hospital': {
        'create': false,
        'delete': false,
        'read': true,
        'read_by_location': true,
        'read_all': true,
        'update_basic_details': false,
        'update_facilities_details': false,
        'update_review_details': false
    },
    'hospital_facility': {
        'create': false,
        'update': false,
    },
    'hospital_review': {
        'create': true,
        'update': true,
    },
    //appointments policy 
    'appointment': {
        'create': true,
        'update': async (req, decodedToken, appointmentId) => {
            const appointment = await Appointment.findById(appointmentId);
            return appointment && String(appointment.patientId).trim() === String(decodedToken.uid || decodedToken.data.userId).trim();
        },
        'delete': async (req, decodedToken, appointmentId) => {
            // Patient can delete their own appointment
            const appointment = await Appointment.findById(appointmentId);
            return appointment && String(appointment.patientId).trim() === String(decodedToken.uid || decodedToken.data.userId).trim();
        },
        'read': async (req, decodedToken, appointmentId) => {
            // Patient can read their own appointment
            const appointment = await Appointment.findById(appointmentId);
            return appointment && String(appointment.patientId).trim() === String(decodedToken.uid || decodedToken.data.userId).trim();
        },
        'process_payment': false, // Patients don't "process" payments
        'read_by_doctor': false, // Patients cannot read appointments by doctor
        'read_by_hospital': false, // Patients cannot read appointments by hospital
        'read_by_patient': async (req, decodedToken, patientIdFromRoute) => {
            // Patient can read appointments for their own patient ID
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(patientIdFromRoute).trim();
        },
    },
    'search': {
        'search_hospital': true,
        'read': true
    },
    'patient_notes': {
        'create': false,
        'read_by_doctor': false,
        'read_by_patient': async (req, decodedToken, patientIdFromRoute) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(patientIdFromRoute).trim();
        },
        'update': false,
        'delete': false,
    },
    'qr_code': {
        'generate': true,
        'read': false
    }
    ,
    'favourite': {
        'add': true,
        'read': true
    },
    'qa': {
        'create': false,
        'read_all': true,
        'update': false,
        'delete': false
    }
    , 'review': {
        'create': true, // Patient can create a review
        'read_by_doctor': true, // Patient can read reviews for any doctor
        'read_doctor_summary': true, // Patient can read doctor rating summary for any doctor
        'update_patient_review': async (req, decodedToken, patientIdFromRoute) => {
            // Patient can update their own review (identified by patientId in route)
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(patientIdFromRoute).trim();
        },
        'update': async (req, decodedToken, reviewId) => {
            // Patient can update their own review (identified by reviewId)
            const patientUserId = decodedToken.uid || decodedToken.data.userId;
            const review = await Review.findById(reviewId);
            return review && String(review.patientId).trim() === String(patientUserId).trim();
        },
        'delete': false, // Patients cannot delete reviews
        'moderate': false,
        'bulk_moderate': false,
        'read_suspicious': false,
    },
    'file': {
        'upload': true,
        'read_all': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        },
        'download': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        },
        'delete': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        }
    }


};

export default patientPolicies;