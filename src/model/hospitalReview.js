
import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id";

const { Schema, model } = mongoose;

const hospitalReviewSchema = new Schema({
    reviewId: {
        type: String,
        required: [true, 'Review ID is required'],
        unique: true,
        default: () => generateUniqueId({
            length: 8,
            useNumbers: true,
            useLetters: true,
        })
    },
    hospitalId: {
        type: String,
        required: [true, 'Hospital ID is required'],
        ref: 'Hospital',
        trim: true
    },
    patientId: {
        type: String,
        required: [true, 'Patient ID is required'],
        trim: true
    },
    overallRating: {
        type: Number,
        required: [true, 'Overall rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        validate: {
            validator: function(value) {
                return Number.isInteger(value * 2);
            },
            message: 'Rating must be in 0.5 increments (1, 1.5, 2, 2.5, etc.)'
        }
    },
    categoryRatings: {
        cleanliness: {
            type: Number,
            min: [1, 'Cleanliness rating must be at least 1'],
            max: [5, 'Cleanliness rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Cleanliness rating must be in 0.5 increments'
            }
        },
        staffBehavior: {
            type: Number,
            min: [1, 'Staff behavior rating must be at least 1'],
            max: [5, 'Staff behavior rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Staff behavior rating must be in 0.5 increments'
            }
        },
        waitingTime: {
            type: Number,
            min: [1, 'Waiting time rating must be at least 1'],
            max: [5, 'Waiting time rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Waiting time rating must be in 0.5 increments'
            }
        },
        foodQuality: {
            type: Number,
            min: [1, 'Food quality rating must be at least 1'],
            max: [5, 'Food quality rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Food quality rating must be in 0.5 increments'
            }
        },
        amenities: {
            type: Number,
            min: [1, 'Amenities rating must be at least 1'],
            max: [5, 'Amenities rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Amenities rating must be in 0.5 increments'
            }
        },
        emergencyResponse: {
            type: Number,
            min: [1, 'Emergency response rating must be at least 1'],
            max: [5, 'Emergency response rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Emergency response rating must be in 0.5 increments'
            }
        }
    },
    reviewText: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        minlength: [20, 'Review must be at least 20 characters'],
        maxlength: [2000, 'Review cannot exceed 2000 characters'],
        validate: {
            validator: function(text) {
                const wordCount = text.trim().split(/\s+/).length;
                return wordCount >= 5;
            },
            message: 'Review must contain at least 5 words'
        }
    },
    visitType: {
        type: String,
        required: [true, 'Visit type is required'],
        enum: {
            values: ['Emergency', 'Inpatient', 'Outpatient', 'Diagnostic', 'Surgery', 'Consultation', 'Maternity'],
            message: 'Visit type must be one of: Emergency, Inpatient, Outpatient, Diagnostic, Surgery, Consultation, Maternity'
        }
    },
    visitDate: {
        type: Date,
        required: [true, 'Visit date is required'],
        validate: {
            validator: function(date) {
                const visitDate = new Date(date);
                const currentDate = new Date();
                const maxPastDate = new Date();
                maxPastDate.setFullYear(currentDate.getFullYear() - 2);
                
                return visitDate <= currentDate && visitDate >= maxPastDate;
            },
            message: 'Visit date must be within the last 2 years and not in the future'
        }
    },
    stayDuration: {
        type: Number,
        min: [0, 'Stay duration cannot be negative'],
        max: [365, 'Stay duration cannot exceed 365 days'],
        validate: {
            validator: function(duration) {
                if (this.visitType === 'Emergency' && duration > 7) {
                    return false;
                }
                if (this.visitType === 'Outpatient' && duration > 1) {
                    return false;
                }
                return true;
            },
            message: 'Stay duration is inconsistent with visit type'
        }
    },
    departmentVisited: {
        type: [String],
        validate: {
            validator: function(departments) {
                const validDepartments = [
                    'Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
                    'Gynecology', 'Surgery', 'ICU', 'Radiology', 'Laboratory',
                    'Pharmacy', 'Administration', 'Billing', 'Reception'
                ];
                return departments.every(dept => validDepartments.includes(dept));
            },
            message: 'Invalid department name provided'
        }
    },
    wouldRecommend: {
        type: Boolean,
        required: [true, 'Recommendation preference is required']
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    verificationDetails: {
        patientCode: {
            type: String,
            trim: true
        },
        verifiedBy: {
            type: String,
            trim: true
        },
        verifiedAt: {
            type: Date
        }
    },
    adminResponse: {
        responseText: {
            type: String,
            trim: true,
            maxlength: [1000, 'Admin response cannot exceed 1000 characters']
        },
        respondedAt: {
            type: Date
        },
        respondedBy: {
            type: String,
            trim: true,
            maxlength: [100, 'Responder name cannot exceed 100 characters']
        }
    },
    status: {
        type: String,
        enum: {
            values: ['Pending', 'Approved', 'Rejected', 'Hidden', 'Under_Review'],
            message: 'Status must be one of: Pending, Approved, Rejected, Hidden, Under_Review'
        },
        default: 'Pending'
    },
    moderationFlags: {
        isSpam: {
            type: Boolean,
            default: false
        },
        isInappropriate: {
            type: Boolean,
            default: false
        },
        isFake: {
            type: Boolean,
            default: false
        },
        suspicionScore: {
            type: Number,
            min: [0, 'Suspicion score cannot be negative'],
            max: [10, 'Suspicion score cannot exceed 10'],
            default: 0
        }
    },
    interactionMetrics: {
        helpfulCount: {
            type: Number,
            min: [0, 'Helpful count cannot be negative'],
            default: 0
        },
        reportCount: {
            type: Number,
            min: [0, 'Report count cannot be negative'],
            default: 0
        },
        viewCount: {
            type: Number,
            min: [0, 'View count cannot be negative'],
            default: 0
        }
    },
    metadata: {
        ipAddress: {
            type: String,
            validate: {
                validator: function(ip) {
                    if (!ip) return true;
                    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
                    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
                },
                message: 'Invalid IP address format'
            }
        },
        userAgent: {
            type: String,
            maxlength: [500, 'User agent cannot exceed 500 characters']
        },
        submissionSource: {
            type: String,
            enum: ['Web', 'Mobile_App', 'Email_Survey', 'SMS_Survey', 'Paper_Form'],
            default: 'Web'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

hospitalReviewSchema.virtual('averageCategoryRating').get(function() {
    const ratings = this.categoryRatings;
    const validRatings = Object.values(ratings).filter(rating => rating != null);
    if (validRatings.length === 0) return 0;
    return validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
});

hospitalReviewSchema.virtual('reviewAge').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

hospitalReviewSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    if (this.isModified('reviewText')) {
        this.reviewText = this.reviewText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        this.reviewText = this.reviewText.replace(/<[^>]*>/g, '');
    }
    
    next();
});

hospitalReviewSchema.pre('validate', function(next) {
    if (this.visitDate && this.visitDate > Date.now()) {
        return next(new Error('Visit date cannot be in the future'));
    }
    
    if (this.overallRating && this.categoryRatings) {
        const categoryAvg = this.averageCategoryRating;
        if (categoryAvg > 0 && Math.abs(this.overallRating - categoryAvg) > 2) {
            return next(new Error('Overall rating is significantly different from category average'));
        }
    }
    
    next();
});

hospitalReviewSchema.index({ hospitalId: 1, status: 1 });
hospitalReviewSchema.index({ overallRating: -1 });
hospitalReviewSchema.index({ createdAt: -1 });
hospitalReviewSchema.index({ visitType: 1, status: 1 });
hospitalReviewSchema.index({ patientId: 1, hospitalId: 1 }, { unique: true });
hospitalReviewSchema.index({ 'moderationFlags.suspicionScore': -1 });

const HospitalReview = model('HospitalReview', hospitalReviewSchema);
export default HospitalReview;