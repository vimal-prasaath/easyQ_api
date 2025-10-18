import mongoose from "mongoose";
import Counter from "./counter.js";

const { Schema, model } = mongoose;

const doctorSchema = new Schema({
        doctorId: {
        type: String,
        unique: true
    },

    name: {
        type: String,
        required: true,
        trim: true,

    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, 'Gender is required']
    },
    dateOfBirth: {
        type: Date
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        trim: true,
        default: "General Medicine",
        validate: {
            validator: function(v) {
                if (!v || v.trim() === '') return true; // Will be handled by default
                const departments = v.split(',').map(d => d.trim());
                const validDepartments = [
                    "General Medicine", "General Checkup", "Pediatrics", "Gynecology",
                    "Cardiology", "Dermatology", "Dental", "Diabetology", "Eye Care",
                    "Orthopedics", "Gastroenterology", "Pulmonology", "Neurology",
                    "Urology", "Physiotherapy", "Emergency Care"
                ];
                return departments.every(dept => validDepartments.includes(dept));
            },
            message: 'Specialization must contain only valid departments from the predefined list'
        }
    },
    qualification: {
        type: [String],
        default: []
    },
    registrationNumber: {
        type: String,
        required: [true, 'Registration number is required'],
        trim: true,
        unique: true
    },
    doctorType: {
        type: String,
        required: [true, 'Doctor type is required'],
        enum: ['General Practitioner', 'Specialist', 'Consultant', 'Senior Consultant', 'Resident Doctor', 'Intern'],
        default: 'General Practitioner'
    },
    serviceStartDate: {
        type: Date,
        required: [true, 'Service start date is required']
    },
    experienceYears: {
        type: Number,
        virtual: true,
        get: function () {
            if (!this.serviceStartDate) return 0;
            const currentDate = new Date();
            const startDate = new Date(this.serviceStartDate);
            const diffInMs = currentDate - startDate;
            const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
            return Math.floor(diffInYears);
        }
    },
    isHeadOfDepartment:{
        type: Boolean,
        default: false
    },
    hospitalId: {
        type: String,
        required: true
    },
    profileImageUrl: {
        type: String,
        default: 'https://example.com/default-doctor.png',
      },

    profileImage: {
        fileName: {
            type: String,
            default: null
        },
        fileUrl: {
            type: String,
            default: 'https://example.com/default-doctor.png'
        },
        uploadedAt: {
            type: Date,
            default: null
        }
    },

    consultantFee: {
        type: Number,
        required: [true, 'Consultant fee is required'],
        min: [0, 'Consultant fee cannot be negative']
    },
    status: {
        type: String,
        enum: ['Available', 'Unavailable', 'On Leave', 'Emergency Only'],
        default: 'Unavailable'
    },
    workingHours: [
        {
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            },
        date:{
        type: Date,
        required: [true, 'date is required'],
        validate: {
            validator: function(v) {
                if (v instanceof Date) {
                    return true; // Allow any valid date
                }
                if (typeof v === 'string') {
                    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[1-2][0-9]|3[0-1])\/\d{4}$/;
                    if (!dateRegex.test(v)) {
                        this.invalidate('date', 'Date must be in MM/DD/YYYY format.', v);
                        return false;
                    }
                }
                return true;
            }
        }
        },
            available:{
                type: String,
                enum: ['earyMorning', 'morning', 'afternoon', 'night']
            },
            timeSlots: [
                {
                    startTime: {
                        type: String,
                        required: true
                    },
                    endTime: {
                        type: String,
                        required: true
                    }
                }
            ]
        }
    ],

    patientIds: [{
        type: String,
        ref: 'User'
    }],

    maxAppointment:{type: String,default:20},
    
    unlimitedToken: {
        type: Boolean,
        default: false
    },
    
    // Authentication fields
    password: {
        type: String,
        required: false,
        select: false // Don't include in queries by default
    },
    isPasswordSet: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    
    permissions: {
        profile: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        tokenIssued: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        checkedIn: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        userLogs: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        documentsView: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        doctorsList: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        addDoctor: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        editDoctor: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        deleteDoctor: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        todayLogs: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        scanQr: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        uploadDocs: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Doctor delay management
    delays: [{
        date: {
            type: Date,
            required: true
        },
        startTime: {
            type: String,
            required: true,
            match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
        },
        durationMinutes: {
            type: Number,
            required: true,
            min: [1, 'Duration must be at least 1 minute'],
            max: [480, 'Duration cannot exceed 8 hours']
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, 'Reason cannot exceed 500 characters']
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: String,
            required: true
        }
    }]
});

doctorSchema.set('toJSON', { 
    transform: function(doc, ret) {
        // Remove the nested profileImage object
        delete ret.profileImage;
        return ret;
    }
});
doctorSchema.set('toObject', { virtuals: true });

// Generate doctorId before saving
doctorSchema.pre('save', async function (next) {
    // Generate doctorId if not provided
    if (!this.doctorId) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'doctorId' },
                { $inc: { sequence_value: 1 } },
                { new: true, upsert: true }
            );
            this.doctorId = `D${counter.sequence_value.toString().padStart(4, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    
    this.updatedAt = Date.now();
    next();
});

const Doctor = model('Doctor', doctorSchema);
export default Doctor;