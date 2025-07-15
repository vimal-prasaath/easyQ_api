
import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id";

const { Schema, model } = mongoose;

const doctorReviewSchema = new Schema({
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
    doctorId: {
        type: String,
        required: [true, 'Doctor ID is required'],
        ref: 'Doctor',
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
        communication: {
            type: Number,
            min: [1, 'Communication rating must be at least 1'],
            max: [5, 'Communication rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Communication rating must be in 0.5 increments'
            }
        },
        expertise: {
            type: Number,
            min: [1, 'Expertise rating must be at least 1'],
            max: [5, 'Expertise rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Expertise rating must be in 0.5 increments'
            }
        },
        punctuality: {
            type: Number,
            min: [1, 'Punctuality rating must be at least 1'],
            max: [5, 'Punctuality rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Punctuality rating must be in 0.5 increments'
            }
        },
        bedSideManner: {
            type: Number,
            min: [1, 'Bedside manner rating must be at least 1'],
            max: [5, 'Bedside manner rating cannot exceed 5'],
            validate: {
                validator: function(value) {
                    return value === undefined || Number.isInteger(value * 2);
                },
                message: 'Bedside manner rating must be in 0.5 increments'
            }
        }
    },
    reviewText: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        minlength: [15, 'Review must be at least 15 characters'],
        maxlength: [1500, 'Review cannot exceed 1500 characters'],
        validate: {
            validator: function(text) {
                const wordCount = text.trim().split(/\s+/).length;
                return wordCount >= 3;
            },
            message: 'Review must contain at least 3 words'
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
                maxPastDate.setFullYear(currentDate.getFullYear() - 1);
                
                return visitDate <= currentDate && visitDate >= maxPastDate;
            },
            message: 'Visit date must be within the last year and not in the future'
        }
    },
    treatmentType: {
        type: String,
        required: [true, 'Treatment type is required'],
        enum: {
            values: ['Consultation', 'Surgery', 'Treatment', 'Follow-up', 'Emergency', 'Diagnostic', 'Therapy'],
            message: 'Treatment type must be one of: Consultation, Surgery, Treatment, Follow-up, Emergency, Diagnostic, Therapy'
        }
    },
    appointmentType: {
        type: String,
        enum: {
            values: ['First_Visit', 'Follow_up', 'Second_Opinion', 'Emergency'],
            message: 'Appointment type must be one of: First_Visit, Follow_up, Second_Opinion, Emergency'
        },
        required: [true, 'Appointment type is required']
    },
    treatmentOutcome: {
        type: String,
        enum: {
            values: ['Excellent', 'Good', 'Satisfactory', 'Poor', 'Ongoing'],
            message: 'Treatment outcome must be one of: Excellent, Good, Satisfactory, Poor, Ongoing'
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
        appointmentId: {
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
            maxlength: [800, 'Admin response cannot exceed 800 characters']
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
                    return ipv4Regex.test(ip);
                },
                message: 'Invalid IP address format'
            }
        },
        submissionSource: {
            type: String,
            enum: ['Web', 'Mobile_App', 'Email_Survey'],
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

doctorReviewSchema.virtual('averageCategoryRating').get(function() {
    const ratings = this.categoryRatings;
    const validRatings = Object.values(ratings).filter(rating => rating != null);
    if (validRatings.length === 0) return 0;
    return validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
});

doctorReviewSchema.virtual('reviewAge').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

doctorReviewSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    if (this.isModified('reviewText')) {
        this.reviewText = this.reviewText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        this.reviewText = this.reviewText.replace(/<[^>]*>/g, '');
    }
    
    next();
});

doctorReviewSchema.pre('validate', function(next) {
    if (this.visitDate && this.visitDate > Date.now()) {
        return next(new Error('Visit date cannot be in the future'));
    }
    
    if (this.overallRating && this.categoryRatings) {
        const categoryAvg = this.averageCategoryRating;
        if (categoryAvg > 0 && Math.abs(this.overallRating - categoryAvg) > 1.5) {
            return next(new Error('Overall rating is significantly different from category average'));
        }
    }
    
    next();
});

doctorReviewSchema.index({ doctorId: 1, status: 1 });
doctorReviewSchema.index({ overallRating: -1 });
doctorReviewSchema.index({ createdAt: -1 });
doctorReviewSchema.index({ treatmentType: 1, status: 1 });
doctorReviewSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });
doctorReviewSchema.index({ 'moderationFlags.suspicionScore': -1 });

const DoctorReview = model('DoctorReview', doctorReviewSchema);
export default DoctorReview;