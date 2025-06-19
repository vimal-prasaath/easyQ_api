import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id";


const { Schema, model } = mongoose;

const doctorSchema = new Schema({
    doctorId: {
        type: String,
        required: true,
        unique: true,
        default: () => {
         return  generateUniqueId({
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
        required: true,
      
    },
    mobileNumber: {
        type: String,
        trim: true
       
    },
    gender: {
        type: String,
      
    },
    dateOfBirth: {
        type: Date
    },
    specialization: {
        type: String,
     
    },
    qualification: {
        type: [String],
        default: []
    },
    experienceYears: {
        type: Number,
        required: true,
        min: 0
    },

    hospitalId: {
        type: String,
        required: true
    },

    profileImageUrl: {
        type: String,
        default: 'https://example.com/default-doctor.png'
    },

     patientNotes: [{ 
            patientId: {
            type: String,
            required: true
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 2000 
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
 
    status: {
        type: String,
        default: 'Unavailable', 
    },

    daysAvailable: {
        type: [String], 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        default: [],
    },
    workingHours: [
        {
            day: {
                type: String,
             
            },
            startTime: {
                type: String, 
               
            },
            endTime: {
                type: String, 
               
            },
            
         
        }],

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

doctorSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Doctor = model('Doctor', doctorSchema);
export default Doctor;