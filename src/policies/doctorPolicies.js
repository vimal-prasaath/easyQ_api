import User from '../model/userProfile.js'; 
import Doctor from '../model/doctor.js';
import PatientNote from '../model/patientNotes.js'; 
import Appointment from '../model/appointment.js';
const doctorPolicies = {
    // Policies for the doctor's own profile
    'profile': {
        'read_own': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        },
        'update': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        }
    },
    // Policies for the 'doctor' resource type (for creation, deletion, and listing of doctors)
    'doctor': {
        'create': false, 
        'delete': false
    },
    // Policies for patient notes (assuming doctors manage these)
    'patient_notes': {
        'create': true,
        'read_by_doctor': async (req, decodedToken, doctorIdFromRoute) => {
            // Doctor can read notes if the doctorId in the route matches their own userId
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            return String(doctorUserId).trim() === String(doctorIdFromRoute).trim();
        },
        'read_by_patient': async (req, decodedToken, patientIdFromRoute) => {
            // Doctor can read notes for patients assigned to them
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;
            const doctor = await Doctor.findOne({ userId: doctorUserId });
            if (!doctor || !doctor.patientIds) return false;
            return doctor.patientIds.includes(patientIdFromRoute);
        },
        'update': async (req, decodedToken, noteId) => {
            // Doctor can update notes if the note belongs to one of their patients
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;
            const patientNote = await PatientNote.findById(noteId);
            if (!patientNote) return false;
            const doctor = await Doctor.findOne({ userId: doctorUserId });
            if (!doctor || !doctor.patientIds.includes(patientNote.patientId)) {
                return false;
            }
            return true;
        },
        'delete': false
    },
    'appointments': {
        'create': true,
        'update': async (req, decodedToken, appointmentId) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;
            const appointment = await Appointment.findById(appointmentId);
            return appointment && String(appointment.doctorId).trim() === String(doctorUserId).trim();
        },
        'delete': async (req, decodedToken, appointmentId) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;
            const appointment = await Appointment.findById(appointmentId);
            return appointment && String(appointment.doctorId).trim() === String(doctorUserId).trim();
        },
        'read': async (req, decodedToken, appointmentId) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;
            const appointment = await Appointment.findById(appointmentId);
            return appointment && String(appointment.doctorId).trim() === String(doctorUserId).trim();
        },
        'process_payment': false,
        'read_by_doctor': async (req, decodedToken, doctorIdFromRoute) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            return String(doctorUserId).trim() === String(doctorIdFromRoute).trim();
        },
        'read_by_hospital': false,
        'read_by_patient': async (req, decodedToken, patientIdFromRoute) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;
            const doctor = await Doctor.findOne({ userId: doctorUserId });
            if (!doctor || !doctor.patientIds) return false;
            return doctor.patientIds.includes(patientIdFromRoute);
        },
        'update_status': true,
    },
    'hospital': {
        'read': true, // Doctors can read details of any specific hospital
        'read_all': true, // Doctors can read all hospitals
        'read_by_location': true, // Doctors can search hospitals by location
        'create': false, // Doctors cannot create hospitals
        'update_basic_details': false, // Doctors cannot update hospital details
        'delete': false, // Doctors cannot delete hospitals
    },
    'hospital_facility': {
        'create': false, // Doctors cannot add hospital facilities
        'update': false, // Doctors cannot update hospital facilities
    },
    'hospital_review': {
        'create': true, // Doctors can create hospital reviews
        'update': async (req, decodedToken, hospitalIdFromRoute) => {
            // Doctors can update their *own* review for a hospital.
            // This requires fetching the review and checking ownership.
            return true; // Placeholder, implement actual review ownership check
        },
    },
    // General 'user' resource policies (doctors usually don't manage general users)
    'user': {
        'read_all': false,
        'read_inactive_users': false,
        'activate': false,
        'delete': false,
        'read': async (req, decodedToken, patientUserId) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;

            const doctor = await Doctor.findOne({ userId: doctorUserId });
            if (!doctor || !doctor.patientIds) return false;

            return doctor.patientIds.includes(patientUserId);
        },
    },
    'search': {
        'search_hospital': true,
        'read':true
    },
    'qr_code':{
        'generate':false,
        'read':false
    }
    ,'favourite':{
        'add':false,
        'read':false
    },
    'qa':{
        'create':false,
        'read_all':true,
        'update':false,
        'delete':false
    },
    'review': {
        'create': false,
        'read_by_doctor': async (req, decodedToken, doctorIdFromRoute) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            return String(doctorUserId).trim() === String(doctorIdFromRoute).trim();
        },
        'read_doctor_summary': async (req, decodedToken, doctorIdFromRoute) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            return String(doctorUserId).trim() === String(doctorIdFromRoute).trim();
        },
        'update_patient_review': false,
        'update': false,
        'delete': false,
        'moderate': false,
        'bulk_moderate': false,
        'read_suspicious': false,
    },
      'file': {
         'upload':true,
        'read_all':  async (req, decodedToken, patientUserId) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;

            const doctor = await Doctor.findOne({ userId: doctorUserId });
            if (!doctor) return false;

            return doctor.patientIds.includes(patientUserId);
        },
        'download': async (req, decodedToken, patientUserId) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;

            const doctor = await Doctor.findOne({ userId: doctorUserId });
            if (!doctor) return false;

            return doctor.patientIds.includes(patientUserId);
        },
        'delete':  async (req, decodedToken, patientUserId) => {
            const doctorUserId = decodedToken.uid || decodedToken.data.userId;
            if (!doctorUserId) return false;

            const doctor = await Doctor.findOne({ userId: doctorUserId });
            if (!doctor) return false;

            return doctor.patientIds.includes(patientUserId);
        }
    }
   
};

export default doctorPolicies;

