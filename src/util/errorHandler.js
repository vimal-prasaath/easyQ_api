
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from './statusCode.js';

export class ValidationErrorHandler {
    static handleSchemaValidation(error, next) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message,
                value: err.value,
                kind: err.kind
            }));

            const mainMessage = errors.length === 1 
                ? errors[0].message 
                : `Validation failed for ${errors.length} fields`;

            return next(new EasyQError(
                'SchemaValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                mainMessage,
                { validationErrors: errors }
            ));
        }
        return null;
    }

    static handleCastError(error, next) {
        if (error.name === 'CastError') {
            const message = `Invalid ${error.path}: ${error.value}. Expected ${error.kind}`;
            
            return next(new EasyQError(
                'DataTypeError',
                httpStatusCode.BAD_REQUEST,
                true,
                message,
                { 
                    field: error.path,
                    expectedType: error.kind,
                    receivedValue: error.value
                }
            ));
        }
        return null;
    }

    static handleDuplicateKeyError(error, next) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const value = error.keyValue[field];
            
            const message = `Duplicate value for ${field}: '${value}'. This ${field} already exists.`;
            
            return next(new EasyQError(
                'DuplicateEntryError',
                httpStatusCode.CONFLICT,
                true,
                message,
                {
                    field: field,
                    value: value,
                    duplicateKey: error.keyValue
                }
            ));
        }
        return null;
    }

    static handleOperationalErrors(error, operation, next) {
        const operationalErrorMap = {
            'create': {
                'E11000': 'Record already exists with the provided unique identifier',
                'NETWORK_ERROR': 'Unable to connect to database during creation',
                'TIMEOUT': 'Database operation timed out during creation'
            },
            'update': {
                'NOT_FOUND': 'Record not found for update',
                'VERSION_CONFLICT': 'Record was modified by another process',
                'VALIDATION_FAILED': 'Update validation failed'
            },
            'delete': {
                'NOT_FOUND': 'Record not found for deletion',
                'FOREIGN_KEY_CONSTRAINT': 'Cannot delete record due to existing references'
            },
            'read': {
                'NOT_FOUND': 'Requested record not found',
                'ACCESS_DENIED': 'Insufficient permissions to access this record'
            }
        };

        const operationErrors = operationalErrorMap[operation] || {};
        const errorKey = this.getErrorKey(error);
        
        if (operationErrors[errorKey]) {
            return next(new EasyQError(
                'OperationalError',
                this.getStatusCodeForError(errorKey),
                true,
                operationErrors[errorKey],
                { operation, originalError: error.message }
            ));
        }
        
        return null;
    }

    static getErrorKey(error) {
        if (error.code === 11000) return 'E11000';
        if (error.message.includes('timeout')) return 'TIMEOUT';
        if (error.message.includes('network')) return 'NETWORK_ERROR';
        if (error.message.includes('not found')) return 'NOT_FOUND';
        if (error.message.includes('version')) return 'VERSION_CONFLICT';
        if (error.message.includes('permission')) return 'ACCESS_DENIED';
        return 'UNKNOWN';
    }

    static getStatusCodeForError(errorKey) {
        const statusMap = {
            'E11000': httpStatusCode.CONFLICT,
            'TIMEOUT': httpStatusCode.REQUEST_TIMEOUT || 408,
            'NETWORK_ERROR': httpStatusCode.SERVICE_UNAVAILABLE || 503,
            'NOT_FOUND': httpStatusCode.NOT_FOUND,
            'VERSION_CONFLICT': httpStatusCode.CONFLICT,
            'ACCESS_DENIED': httpStatusCode.FORBIDDEN,
            'VALIDATION_FAILED': httpStatusCode.BAD_REQUEST
        };
        return statusMap[errorKey] || httpStatusCode.INTERNAL_SERVER_ERROR;
    }

    static handleInputValidation(inputData, validationRules) {
        const errors = [];

        for (const [field, rules] of Object.entries(validationRules)) {
            const value = inputData[field];
            
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    field,
                    message: `${field} is required`,
                    code: 'REQUIRED_FIELD_MISSING'
                });
                continue;
            }

            if (value !== undefined && value !== null) {
                if (rules.type && typeof value !== rules.type) {
                    errors.push({
                        field,
                        message: `${field} must be of type ${rules.type}`,
                        code: 'INVALID_TYPE',
                        expectedType: rules.type,
                        receivedType: typeof value
                    });
                }

                if (rules.minLength && value.length < rules.minLength) {
                    errors.push({
                        field,
                        message: `${field} must be at least ${rules.minLength} characters long`,
                        code: 'MIN_LENGTH_VIOLATION',
                        minLength: rules.minLength,
                        actualLength: value.length
                    });
                }

                if (rules.maxLength && value.length > rules.maxLength) {
                    errors.push({
                        field,
                        message: `${field} cannot exceed ${rules.maxLength} characters`,
                        code: 'MAX_LENGTH_VIOLATION',
                        maxLength: rules.maxLength,
                        actualLength: value.length
                    });
                }

                if (rules.pattern && !rules.pattern.test(value)) {
                    errors.push({
                        field,
                        message: rules.patternMessage || `${field} format is invalid`,
                        code: 'PATTERN_MISMATCH',
                        pattern: rules.pattern.toString()
                    });
                }

                if (rules.enum && !rules.enum.includes(value)) {
                    errors.push({
                        field,
                        message: `${field} must be one of: ${rules.enum.join(', ')}`,
                        code: 'INVALID_ENUM_VALUE',
                        allowedValues: rules.enum,
                        receivedValue: value
                    });
                }

                if (rules.customValidator && !rules.customValidator(value)) {
                    errors.push({
                        field,
                        message: rules.customMessage || `${field} validation failed`,
                        code: 'CUSTOM_VALIDATION_FAILED'
                    });
                }
            }
        }

        return errors;
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

    static createErrorResponse(errors, type = 'ValidationError') {
        return {
            success: false,
            error: {
                type: type,
                message: `Validation failed for ${errors.length} field(s)`,
                details: errors
            },
            timestamp: new Date().toISOString()
        };
    }

    static handleAllErrors(error, operation, next) {
        if (this.handleSchemaValidation(error, next)) return;
        if (this.handleCastError(error, next)) return;
        if (this.handleDuplicateKeyError(error, next)) return;
        if (this.handleOperationalErrors(error, operation, next)) return;
        
        return next(new EasyQError(
            'UnexpectedError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `An unexpected error occurred during ${operation}: ${error.message}`
        ));
    }
}

