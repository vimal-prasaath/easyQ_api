
export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

export class ReviewValidator {
    static validateRating(rating, fieldName = 'rating') {
        if (!rating || rating < 1 || rating > 5) {
            throw new ValidationError(`${fieldName} must be between 1 and 5`, fieldName);
        }
    }

    static validateDateRange(date, fieldName = 'date') {
        const inputDate = new Date(date);
        const currentDate = new Date();
        
        if (isNaN(inputDate.getTime())) {
            throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
        }
        
        if (inputDate > currentDate) {
            throw new ValidationError(`${fieldName} cannot be in the future`, fieldName);
        }
        
        const twoYearsAgo = new Date(currentDate.getFullYear() - 2, currentDate.getMonth(), currentDate.getDate());
        if (inputDate < twoYearsAgo) {
            throw new ValidationError(`${fieldName} cannot be more than 2 years old`, fieldName);
        }
    }

    static validateTextLength(text, minLength, maxLength, fieldName = 'text') {
        if (!text || typeof text !== 'string') {
            throw new ValidationError(`${fieldName} is required`, fieldName);
        }
        
        const trimmedText = text.trim();
        if (trimmedText.length < minLength) {
            throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName);
        }
        
        if (trimmedText.length > maxLength) {
            throw new ValidationError(`${fieldName} cannot exceed ${maxLength} characters`, fieldName);
        }
    }

    static sanitizeText(text) {
        if (!text || typeof text !== 'string') return text;
        
        return text
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    static validateCategories(categories) {
        if (!categories) return;
        
        const validCategories = ['communication', 'expertise', 'punctuality', 'facilities'];
        
        for (const [key, value] of Object.entries(categories)) {
            if (!validCategories.includes(key)) {
                throw new ValidationError(`Invalid category: ${key}`, 'categories');
            }
            
            if (value !== null && value !== undefined) {
                this.validateRating(value, key);
            }
        }
    }

    static detectSpam(reviewText) {
        const spamPatterns = [
            /(.)\1{5,}/g,
            /^\s*(.+)\s*\1+\s*$/i,
            /(viagra|cialis|loan|casino|poker)/gi,
            /[^\w\s]{10,}/g,
        ];

        const suspiciousPatterns = [
            reviewText.length < 5,
            spamPatterns.some(pattern => pattern.test(reviewText)),
            (reviewText.match(/[A-Z]/g) || []).length / reviewText.length > 0.5,
        ];

        return suspiciousPatterns.filter(Boolean).length >= 2;
    }

    static validateReviewInput(data) {
        const errors = [];
        
        if (!data.doctorId) errors.push({ field: 'doctorId', message: 'Doctor ID is required' });
        if (!data.patientId) errors.push({ field: 'patientId', message: 'Patient ID is required' });
        if (!data.overallRating) errors.push({ field: 'overallRating', message: 'Overall rating is required' });
        if (!data.reviewText) errors.push({ field: 'reviewText', message: 'Review text is required' });
        if (!data.visitDate) errors.push({ field: 'visitDate', message: 'Visit date is required' });
        if (!data.treatmentType) errors.push({ field: 'treatmentType', message: 'Treatment type is required' });
        
        if (data.overallRating && (data.overallRating < 1 || data.overallRating > 5)) {
            errors.push({ field: 'overallRating', message: 'Overall rating must be between 1 and 5' });
        }
        
        if (data.reviewText && data.reviewText.trim().length < 15) {
            errors.push({ field: 'reviewText', message: 'Review text must be at least 15 characters' });
        }
        
        return errors;
    }
    
    static validateHospitalReviewInput(data) {
        const errors = [];
        
        if (!data.hospitalId) errors.push({ field: 'hospitalId', message: 'Hospital ID is required' });
        if (!data.patientId) errors.push({ field: 'patientId', message: 'Patient ID is required' });
        if (!data.overallRating) errors.push({ field: 'overallRating', message: 'Overall rating is required' });
        if (!data.reviewText) errors.push({ field: 'reviewText', message: 'Review text is required' });
        if (!data.visitDate) errors.push({ field: 'visitDate', message: 'Visit date is required' });
        if (!data.serviceType) errors.push({ field: 'serviceType', message: 'Service type is required' });
        
        if (data.overallRating && (data.overallRating < 1 || data.overallRating > 5)) {
            errors.push({ field: 'overallRating', message: 'Overall rating must be between 1 and 5' });
        }
        
        if (data.reviewText && data.reviewText.trim().length < 15) {
            errors.push({ field: 'reviewText', message: 'Review text must be at least 15 characters' });
        }
        
        return errors;
    }
}

export class PatientNotesValidator {
    static validatePrescription(prescription) {
        if (!prescription || !Array.isArray(prescription)) return;
        
        prescription.forEach((item, index) => {
            if (!item.medicine || !item.dosage || !item.frequency || !item.duration) {
                throw new ValidationError(`Prescription item ${index + 1} is missing required fields`, 'prescription');
            }
            
            this.validateTextLength(item.medicine, 2, 100, `prescription[${index}].medicine`);
            this.validateTextLength(item.dosage, 1, 50, `prescription[${index}].dosage`);
            this.validateTextLength(item.frequency, 1, 50, `prescription[${index}].frequency`);
            this.validateTextLength(item.duration, 1, 50, `prescription[${index}].duration`);
        });
    }

    static validateVitalSigns(vitalSigns) {
        if (!vitalSigns) return;
        
        const patterns = {
            bloodPressure: /^\d{2,3}\/\d{2,3}$/,
            heartRate: /^\d{2,3}$/,
            temperature: /^\d{2,3}(\.\d)?$/,
            weight: /^\d{2,3}(\.\d)?$/,
            height: /^\d{2,3}(\.\d)?$/
        };

        for (const [key, value] of Object.entries(vitalSigns)) {
            if (value && patterns[key] && !patterns[key].test(value)) {
                throw new ValidationError(`Invalid ${key} format`, `vitalSigns.${key}`);
            }
        }
    }

    static validateTextLength(text, minLength, maxLength, fieldName = 'text') {
        if (!text || typeof text !== 'string') {
            throw new ValidationError(`${fieldName} is required`, fieldName);
        }
        
        const trimmedText = text.trim();
        if (trimmedText.length < minLength) {
            throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName);
        }
        
        if (trimmedText.length > maxLength) {
            throw new ValidationError(`${fieldName} cannot exceed ${maxLength} characters`, fieldName);
        }
    }
}