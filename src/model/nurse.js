import mongoose from "mongoose";
import Counter from "./counter.js";

const { Schema, model } = mongoose;

const nurseSchema = new Schema({
    nurseId: {
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
    qualification: {
        type: [String],
        default: []
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
    hospitalId: {
        type: String,
        required: true
    },
    profileImageUrl: {
        type: String,
        default: 'https://example.com/default-nurse.png',
    },

    profileImage: {
        fileName: {
            type: String,
            default: null
        },
        fileUrl: {
            type: String,
            default: 'https://example.com/default-nurse.png'
        },
        uploadedAt: {
            type: Date,
            default: null
        }
    },

    status: {
        type: String,
        enum: ['Available', 'On Duty', 'Off Duty', 'On Leave'],
        default: 'Off Duty'
    },
    workingHours: [
        {
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            },
            date: {
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
            available: {
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
        nursesList: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        addNurse: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        editNurse: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
        deleteNurse: { enabled: { type: Boolean, default: false }, viewOnly: { type: Boolean, default: false } },
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
    }
});

nurseSchema.set('toJSON', { 
    transform: function(doc, ret) {
        // Remove the nested profileImage object
        delete ret.profileImage;
        return ret;
    }
});
nurseSchema.set('toObject', { virtuals: true });

// Generate nurseId before saving
nurseSchema.pre('save', async function (next) {
    // Generate nurseId if not provided
    if (!this.nurseId) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'nurseId' },
                { $inc: { sequence_value: 1 } },
                { new: true, upsert: true }
            );
            this.nurseId = `N${counter.sequence_value.toString().padStart(4, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    
    this.updatedAt = Date.now();
    next();
});

const Nurse = model('Nurse', nurseSchema);
export default Nurse;
