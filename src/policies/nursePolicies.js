import User from '../model/userProfile.js'; 
import Nurse from '../model/nurse.js';
import PatientNote from '../model/patientNotes.js'; 
import Appointment from '../model/appointment.js';

const nursePolicies = {
    // Policies for the nurse's own profile
    'profile': {
        'read_own': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        },
        'update': (req, decodedToken, resourceId) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(resourceId).trim();
        }
    },
    // Policies for the 'nurse' resource type (for creation, deletion, and listing of nurses)
    'nurse': {
        'create': false, 
        'delete': false
    },
    // Policies for patient notes (assuming nurses manage these)
    'patient_notes': {
        'create': true,
        'read_by_nurse': async (req, decodedToken, nurseIdFromRoute) => {
            // Nurse can read notes if the nurseId in the route matches their own userId
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            return String(nurseUserId).trim() === String(nurseIdFromRoute).trim();
        },
        'read_by_patient': async (req, decodedToken, patientIdFromRoute) => {
            // Nurse can read notes for patients assigned to them
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;
            const nurse = await Nurse.findOne({ userId: nurseUserId });
            if (!nurse || !nurse.patientIds) return false;
            return nurse.patientIds.includes(patientIdFromRoute);
        },
        'update': async (req, decodedToken, noteId) => {
            // Nurse can update notes if the note belongs to one of their patients
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;
            const patientNote = await PatientNote.findById(noteId);
            if (!patientNote) return false;
            const nurse = await Nurse.findOne({ userId: nurseUserId });
            if (!nurse || !nurse.patientIds.includes(patientNote.patientId)) {
                return false;
            }
            return true;
        },
        'delete': false
    },
    'appointment': {
        'create': true,
        'update': async (req, decodedToken, appointmentId) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;
            const appointment = await Appointment.findById(appointmentId);
            return appointment && String(appointment.nurseId).trim() === String(nurseUserId).trim();
        },
        'delete': async (req, decodedToken, appointmentId) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;
            const appointment = await Appointment.findById(appointmentId);
            return appointment && String(appointment.nurseId).trim() === String(nurseUserId).trim();
        },
        'read': async (req, decodedToken, appointmentId) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;
            const appointment = await Appointment.findById(appointmentId);
            return appointment && String(appointment.nurseId).trim() === String(nurseUserId).trim();
        },
        'process_payment': false,
        'read_by_nurse': async (req, decodedToken, nurseIdFromRoute) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            return String(nurseUserId).trim() === String(nurseIdFromRoute).trim();
        },
        'read_by_hospital': false,
        'read_by_patient': async (req, decodedToken, patientIdFromRoute) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;
            const nurse = await Nurse.findOne({ userId: nurseUserId });
            if (!nurse || !nurse.patientIds) return false;
            return nurse.patientIds.includes(patientIdFromRoute);
        },
        'update_status': true,
    },
    'hospital': {
        'read': true, // Nurses can read details of any specific hospital
        'read_all': true, // Nurses can read all hospitals
        'read_by_location': true, // Nurses can search hospitals by location
        'create': false, // Nurses cannot create hospitals
        'update_basic_details': false, // Nurses cannot update hospital details
        'delete': false, // Nurses cannot delete hospitals
    },
    'hospital_facility': {
        'create': false, // Nurses cannot add hospital facilities
        'update': false, // Nurses cannot update hospital facilities
    },
    'hospital_review': {
        'create': true, // Nurses can create hospital reviews
        'update': async (req, decodedToken, hospitalIdFromRoute) => {
            // Nurses can update their *own* review for a hospital.
            // This requires fetching the review and checking ownership.
            return true; // Placeholder, implement actual review ownership check
        },
    },
    // General 'user' resource policies (nurses usually don't manage general users)
    'user': {
        'read_all': false,
        'read_inactive_users': false,
        'activate': false,
        'delete': false,
        'read': async (req, decodedToken, patientUserId) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;

            const nurse = await Nurse.findOne({ userId: nurseUserId });
            if (!nurse || !nurse.patientIds) return false;

            return nurse.patientIds.includes(patientUserId);
        },
    },
    'search': {
        'search_hospital': true,
        'read': true
    },
    'qr_code': {
        'generate': false,
        'read': false
    },
    'favourite': {
        'add': false,
        'read': false
    },
    'qa': {
        'create': false,
        'read_all': true,
        'update': false,
        'delete': false
    },
    'review': {
        'create': false,
        'read_by_nurse': async (req, decodedToken, nurseIdFromRoute) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            return String(nurseUserId).trim() === String(nurseIdFromRoute).trim();
        },
        'read_nurse_summary': async (req, decodedToken, nurseIdFromRoute) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            return String(nurseUserId).trim() === String(nurseIdFromRoute).trim();
        },
        'update_patient_review': false,
        'update': false,
        'delete': false,
        'moderate': false,
        'bulk_moderate': false,
        'read_suspicious': false,
    },
    'file': {
        'upload': true,
        'read_all': async (req, decodedToken, patientUserId) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;

            const nurse = await Nurse.findOne({ userId: nurseUserId });
            if (!nurse) return false;

            return nurse.patientIds.includes(patientUserId);
        },
        'download': async (req, decodedToken, patientUserId) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;

            const nurse = await Nurse.findOne({ userId: nurseUserId });
            if (!nurse) return false;

            return nurse.patientIds.includes(patientUserId);
        },
        'delete': async (req, decodedToken, patientUserId) => {
            const nurseUserId = decodedToken.uid || decodedToken.data.userId;
            if (!nurseUserId) return false;

            const nurse = await Nurse.findOne({ userId: nurseUserId });
            if (!nurse) return false;

            return nurse.patientIds.includes(patientUserId);
        }
    }
};

export default nursePolicies;
