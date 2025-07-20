const adminPolicies = {
    'any': {
        'create': true,
        'read': true,
        'update': true,
        'delete': true,
        'manage_users': true,
        'manage_hospitals': true,
        'manage_doctors': true,
        'manage_patients': true,
        'manage_appointments': true,
        'process_payment': true
    }
};
export default adminPolicies;