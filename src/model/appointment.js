import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id"; // npm install generate-unique-id

const { Schema, model } = mongoose;

const appointmentSchema = new Schema({

    appointmentId: { 
        type: String,
        required: true,
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
        required: true
    },
    doctorId: { 
        type: String,
        ref: 'Doctor', 
        required: true
    },
    hospitalId: { 
        type: String,
        ref: 'Hospital', 
        required: true
    },

    appointmentDate: {
        type: Date,
        required: true,
     
    },
    appointmentTime: { 
        type: String,
        required: true,
       
    },
    reasonForAppointment: {
        type: String,
        trim: true,
        maxlength: 500, 
        required: true
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