import adminPolicies from './adminPolicies.js';
import doctorPolicies from './doctorPolicies.js';
import patientPolicies from './patientPolicies.js';
import hospitalAdminPolicies from './hospitalAdminPolicies.js';

const authorizationPolicies = {
    'admin': hospitalAdminPolicies,
    'doctor': doctorPolicies,
    'user': patientPolicies,
};

export default authorizationPolicies;
