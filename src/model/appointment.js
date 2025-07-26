import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id"; // npm install generate-unique-id

const { Schema, model } = mongoose;

const appointmentSchema = new Schema({

    appointmentId: { 
        type: String,
        required: [true, 'Appointment ID is required'],
        unique: true,
        default: () => {
        return generateUniqueId({
                length: 5,
                useLetters: false,
                useNumbers: true
            });
        }
    },
    patientId: { 
        type: String,
        ref: 'User',
        required: [true, 'Patient ID is required'],
        validate: {
            validator: function(v) {
                return v && v.trim().length > 0;
            },
            message: 'Patient ID cannot be empty'
        }
    },
    doctorId: { 
        type: String,
        ref: 'Doctor', 
        required: [true, 'Doctor ID is required'],
        validate: {
            validator: function(v) {
                return v && v.trim().length > 0;
            },
            message: 'Doctor ID cannot be empty'
        }
    },
    hospitalId: { 
        type: String,
        ref: 'Hospital', 
        required: [true, 'Hospital ID is required'],
        validate: {
            validator: function(v) {
                return v && v.trim().length > 0;
            },
            message: 'Hospital ID cannot be empty'
        }
    },
    hospitalName: {
       type: String,
       required: true
    },
    doctorName:{
       type: String,
       required: true
    },
   appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
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

                    const parsedDate = new Date(v);
                    const [month, day, year] = v.split('/').map(Number);
                    if (
                        isNaN(parsedDate.getTime()) || 
                        parsedDate.getMonth() + 1 !== month ||
                        parsedDate.getDate() !== day ||
                        parsedDate.getFullYear() !== year
                    ) {
                        this.invalidate('appointmentDate', 'Invalid date provided. Please use a valid MM/DD/YYYY date.', v);
                        return false;
                    }

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const parsedDateOnly = new Date(parsedDate);
                    parsedDateOnly.setHours(0, 0, 0, 0);

                    return parsedDateOnly >= today; 
                }

                this.invalidate('appointmentDate', 'Appointment date must be a valid date string or Date object.', v);
                return false;
            },
            message: props => {
                if (props.reason && props.reason.message) {
                    return props.reason.message;
                }
                return 'Appointment date must be in the future and in MM/DD/YYYY format.';
            }
        }
    },
    appointmentTime: { 
        type: String,
        required: [true, 'Appointment time is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Please provide a valid time in HH:MM format'
        }
    },
    reasonForAppointment: {
        type: String,
        trim: true,
        maxlength: [500, 'Reason for appointment cannot exceed 500 characters'],
        required: [true, 'Reason for appointment is required']
    },
    appointmentType: { 
        type: String,
         required: true
    },
    status: {
        type: String,
        required: true
    },
    bookingSource: { 
        type: String,
    },
    bookedByID: {
        type: String,
        sparse: true
    },
    confirmationSent: {
        type: Boolean,
        default: false
    },
    reminderSent: {
        type: Boolean,
        default: false 
    },
    patientNotes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    doctorNotes: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    reportUrls: { 
        type: [String],
        default: []
    },
    meetingPlatform: {
        type: String,
    },
     paymentStatus: {
        type: String,
        required: true
    },
    paymentAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    currency: { 
        type: String,
        default: "INR"
    },
    paymentMethod: {
        type: String,
        trim: true
    },
    transactionId: {
        type: String, 
        unique: true,
        sparse: true,
        trim: true
    },
 cancellationReason: {
        type: String,
        trim: true,
        maxlength: 500,
        sparse: true
    },
    rescheduledFrom: {
        type: {
            originalAppointmentId: { type: String, ref: 'Appointment' },
            originalDate: { type: Date },
            originalTime: { type: String }
        },
        sparse: true
    },
   createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
     qrCodeDataUrl: {
        type: String,
    },
    
    statusHistory: [
        {
            status: { type: String },
            timestamp: { type: Date, default: Date.now },
            changedBy: { type: String, ref: 'User' } 
        }
    ]
});

appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ hospitalId: 1 }); 
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 }); 
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ paymentStatus: 1 });


appointmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Appointment = model('Appointment', appointmentSchema);
export default Appointment;