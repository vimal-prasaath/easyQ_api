/**
 * Utility functions for processing doctor specializations
 */

// Valid departments list
export const VALID_DEPARTMENTS = [
    "General Medicine", "General Checkup", "Pediatrics", "Gynecology",
    "Cardiology", "Dermatology", "Dental", "Diabetology", "Eye Care",
    "Orthopedics", "Gastroenterology", "Pulmonology", "Neurology",
    "Urology", "Physiotherapy", "Emergency Care"
];

/**
 * Process specialization input - clean, validate, and format
 * @param {string} input - Raw specialization input
 * @returns {string} - Processed specialization string
 */
export function processSpecialization(input) {
    // Handle empty or null input
    if (!input || input.trim() === '') {
        return "General Medicine";
    }
    
    // Split by comma and clean each department
    const departments = input.split(',')
        .map(d => d.trim())
        .filter(d => d !== '');
    
    // Filter to only valid departments
    const validDepartments = departments.filter(dept => 
        VALID_DEPARTMENTS.includes(dept)
    );
    
    // Return valid departments or default
    return validDepartments.length > 0 ? validDepartments.join(',') : "General Medicine";
}

/**
 * Get specialization as array
 * @param {string} specialization - Specialization string
 * @returns {Array} - Array of departments
 */
export function getSpecializationArray(specialization) {
    if (!specialization || specialization.trim() === '') {
        return ["General Medicine"];
    }
    
    return specialization.split(',')
        .map(d => d.trim())
        .filter(d => d !== '');
}

/**
 * Check if specialization contains a specific department (case-insensitive)
 * @param {string} specialization - Specialization string
 * @param {string} searchTerm - Department to search for
 * @returns {boolean} - True if found
 */
export function hasDepartment(specialization, searchTerm) {
    if (!specialization || !searchTerm) return false;
    
    const departments = getSpecializationArray(specialization);
    const searchLower = searchTerm.toLowerCase();
    
    return departments.some(dept => 
        dept.toLowerCase().includes(searchLower)
    );
}

/**
 * Create search filter for specialization
 * @param {string} searchTerm - Search term
 * @returns {Object} - MongoDB filter object
 */
export function createSpecializationFilter(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        return {};
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    return {
        $or: [
            // Exact match (case-insensitive)
            { specialization: { $regex: searchTerm, $options: 'i' } },
            // Partial match within comma-separated values
            { specialization: { $regex: `\\b${searchTerm}\\b`, $options: 'i' } },
            // Word boundary match for better partial matching
            { specialization: { $regex: `.*${searchTerm}.*`, $options: 'i' } }
        ]
    };
}

/**
 * Validate specialization input
 * @param {string} input - Input to validate
 * @returns {Object} - Validation result
 */
export function validateSpecialization(input) {
    if (!input || input.trim() === '') {
        return { isValid: true, processed: "General Medicine", invalidDepartments: [] };
    }
    
    const departments = input.split(',')
        .map(d => d.trim())
        .filter(d => d !== '');
    
    const validDepartments = departments.filter(dept => 
        VALID_DEPARTMENTS.includes(dept)
    );
    
    const invalidDepartments = departments.filter(dept => 
        !VALID_DEPARTMENTS.includes(dept)
    );
    
    return {
        isValid: invalidDepartments.length === 0,
        processed: validDepartments.length > 0 ? validDepartments.join(',') : "General Medicine",
        invalidDepartments,
        validDepartments
    };
}
