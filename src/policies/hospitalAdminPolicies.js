const hospitalAdminPolicies = {
    //roles and permission for the hospital for the hospiatl admin users 
    'hospital': {
        'create': true,
        'read': async (req, decodedToken, hospitalIdFromRoute) => {
            return String(decodedToken.data.hospitalId).trim() === String(hospitalIdFromRoute).trim();
        },
        'read_all': true,
        'read_by_location': true,
        'update_basic_details': async (req, decodedToken, hospitalIdFromRoute) => {
            return String(decodedToken.data.hospitalId).trim() === String(hospitalIdFromRoute).trim();
        },
        'delete': async (req, decodedToken, hospitalIdFromRoute) => {
            return String(decodedToken.data.hospitalId).trim() === String(hospitalIdFromRoute).trim();
        },
    },
    'hospital_facility': {
        'create': async (req, decodedToken) => {
            const targetHospitalId = req.body.hospitalId || decodedToken.data.hospitalId;
            return String(decodedToken.data.hospitalId).trim() === String(targetHospitalId).trim();
        },
        'update': async (req, decodedToken, hospitalIdFromRoute) => {
            return String(decodedToken.data.hospitalId).trim() === String(hospitalIdFromRoute).trim();
        },
    },
    'hospital_review': {
        'create': true,
        'update_review_details': async (req, decodedToken, hospitalIdFromRoute) => {
            return String(decodedToken.data.hospitalId).trim() === String(hospitalIdFromRoute).trim();
        },
    },
    //roles and permission for the appointments for the hospiatl admin users
    'appointment': {
        'create': true,
        'update': true,
        'delete': true,
        'read': true,
        'process_payment': true,
        'read_by_doctor': true,
        'read_by_hospital': true,
        'read_by_patient': true,
        'update_status': true,
    },
    //roles and permission for the user for the  admin users
    'admin': {
        'read_all': (req, decodedToken, hospitalIdFromRoute) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(hospitalIdFromRoute).trim();
        },
        'activate': (req, decodedToken, hospitalIdFromRoute) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(hospitalIdFromRoute).trim();
        },
        'read_inactive_users': (req, decodedToken, hospitalIdFromRoute) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(hospitalIdFromRoute).trim();
        },
        'activate': (req, decodedToken, hospitalIdFromRoute) => {
            return String(decodedToken.uid || decodedToken.data.userId).trim() === String(hospitalIdFromRoute).trim();
        },
        'delete': false
    },
    'doctor': {
        "create": true,
        "delete": true
    },
    'search': {
        'search_hospital': true,
        'read': true
    },
    'patient_notes': {
        'create': true,
        'read_by_doctor': false,
        'read_by_patient': false,
        'update': false,
        'delete': false,
    },
    'qr_code': {
        'generate': true,
        'read': true
    },
    'favourite': {
        'add': true,
        'read': true
    },
    'qa': {
        'create': true,
        'read_all': true,
        'update': true,
        'delete': true
    },
    'review': {
        'create': true,
        'read_by_doctor': true,
        'read_doctor_summary': true,
        'update_patient_review': true,
        'update': true,
        'delete': true,
        'moderate': true,
        'bulk_moderate': true,
        'read_suspicious': true,
    },
    'file': {
        'upload': true,
        'read_all': true,
        'download': true,
        'delete': true
    }
};

export default hospitalAdminPolicies;

