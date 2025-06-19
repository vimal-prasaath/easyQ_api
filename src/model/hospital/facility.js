import mongoose from "mongoose";

const { Schema, model } = mongoose;

const hospitalDetailsSchema = new Schema({
    hospitalId: {
        type: String,
        required: true,
        unique: true,
        ref: 'Hospital'
    },
    facilities: {
        type: [String],
        default: [],
        set: (arr) => [...new Set(arr.map(f => f.trim()))]
    },
    labs: [
        {
            name: { type: String, trim: true, required: true },
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
                required: true
            },
            headOfDepartment: { type: String, trim: true },
            contactNumber: { type: String },
            description: { type: String, trim: true },
            total_number_Doctor: { type: String }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

hospitalDetailsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const HospitalDetails = model('HospitalDetails', hospitalDetailsSchema);
export default HospitalDetails;