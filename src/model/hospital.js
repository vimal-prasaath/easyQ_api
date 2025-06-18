import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id"; // npm install generate-unique-id

const { Schema, model } = mongoose;

const hospitalSchema = new Schema({
    
    hospitalId: {
        type: String,
        default: () => {
          return generateUniqueId({
                length: 4,           
                useLetters: false,
            });
        }
    },
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true},
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true, default: 'India' }
    },
    location: {
        type: {
            type: String, 
           
        },
        coordinates: {
            type: [Number], 
        }
    },

    hospitalType: {
        type: String,
        enum: ['General Hospital', 'Specialty Hospital', 'Clinic', 'Diagnostic Center', 'Maternity Hospital', 'Childrens Hospital', 'Multi-Specialty Hospital', 'Other'],
    },

    imageUrl: {
        type: String,
        default: 'https://example.com/default-hospital.png' 
    },

    facilities: {
        type: [String], 
        default: [],
        set: (arr) => [...new Set(arr.map(f => f.trim()))] 
    },

    labs: [
        {
            name: { type: String,trim: true },
            servicesOffered: { type: [String], default: [] }, 
            contactNumber: { type: String, match: /^\d{10}$/ },
            isOpen24x7: { type: Boolean, default: false }
        }
    ],

    departments: [
        {
            name: {
                type: String,
                trim: true,
            },
            headOfDepartment: { type: String, trim: true },
            contactNumber: { type: String,},
            description: { type: String, trim: true, },
            total_number_Doctor: {type:String,}
        }
    ],

    reviews: [
        {
            reviewerName: {
                type: String,
                trim: true
            },
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                trim: true,
                maxlength: 500
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],

    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
       ambulanceNumber: {
        type: String,
        match: /^\d{10}$/,
        sparse: true, 
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

hospitalSchema.index({ "location": "2dsphere" });

hospitalSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Hospital = model('Hospital', hospitalSchema);
export default Hospital;