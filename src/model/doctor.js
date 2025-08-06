import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id";


const { Schema, model } = mongoose;

const doctorSchema = new Schema({
    doctorId: {
        type: String,
        required: true,
        unique: true,
        default: () => {
            return generateUniqueId({
                length: 4,
                useNumbers: true,
                useLetters: false,
            });

        }
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
        trim: true
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
        default: 'https://example.com/default-doctor.png'
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
                    return v > new Date();
                }
                if (typeof v === 'string') {
                    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[1-2][0-9]|3[0-1])\/\d{4}$/;
                    if (!dateRegex.test(v)) {
                        this.invalidate('appointmentDate', 'Appointment date must be in MM/DD/YYYY format.', v);
                        return false;
                    }
                }
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
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

doctorSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Doctor = model('Doctor', doctorSchema);
export default Doctor;