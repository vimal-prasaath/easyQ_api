import adminPolicies from './adminPolicies.js';
import doctorPolicies from './doctorPolicies.js';
import patientPolicies from './patientPolicies.js';
import hospitalAdminPolicies from './hospitalAdminPolicies.js';
import nursePolicies from './nursePolicies.js';

const authorizationPolicies = {
    'admin': hospitalAdminPolicies,
    'doctor': doctorPolicies,
    'nurse': nursePolicies,
    'user': patientPolicies,
};

export default authorizationPolicies;
