import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id";

const { Schema, model } = mongoose;

const patientNotesSchema = new Schema({
    noteId: {
        type: String,
        required: true,
        unique: true,
        default: () => {
            return generateUniqueId({
                length: 8,
                useNumbers: true,
                useLetters: true,
            });
        }
    },
    doctorId: {
        type: String,
        required: [true, 'Doctor ID is required'],
        ref: 'Doctor'
    },
    patientId: {
        type: String,
        required: [true, 'Patient ID is required']
    },
    notes: {
        type: String,
        required: [true, 'Notes content is required'],
        trim: true,
        maxlength: [2000, 'Notes cannot exceed 2000 characters']
    },
    diagnosis: {
        type: String,
        trim: true,
        maxlength: [500, 'Diagnosis cannot exceed 500 characters']
    },
    prescription: [{
        medicine: {
            type: String,
            required: true,
            trim: true
        },
        dosage: {
            type: String,
            required: true,
            trim: true
        },
        frequency: {
            type: String,
            required: true,
            trim: true
        },
        duration: {
            type: String,
            required: true,
            trim: true
        }
    }],
    visitType: {
        type: String,
        enum: ['Regular Checkup', 'Follow-up', 'Emergency', 'Consultation', 'Surgery'],
        required: [true, 'Visit type is required']
    },
    symptoms: [{
        type: String,
        trim: true
    }],
    vitalSigns: {
        bloodPressure: String,
        heartRate: String,
        temperature: String,
        weight: String,
        height: String
    },
    followUpDate: {
        type: Date
    },
    isPrivate: {
        type: Boolean,
        default: false
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

patientNotesSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for better query performance
patientNotesSchema.index({ doctorId: 1, patientId: 1 });
patientNotesSchema.index({ createdAt: -1 });

const PatientNotes = model('PatientNotes', patientNotesSchema);
export default PatientNotes;
