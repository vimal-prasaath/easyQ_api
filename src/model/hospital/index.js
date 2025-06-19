import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id";

const { Schema, model } = mongoose;

const hospitalSchema = new Schema({
    hospitalId: {
        type: String,
        unique: true,
        default: () => {
            return generateUniqueId({
                length: 4,
                useLetters: false,
            });
        }
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^\S+@\S+\.\S+$/
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    ambulanceNumber: {
        type: String,
        sparse: true,
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true, default: 'India' }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere'
        }
    },
    hospitalType: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: 'https://example.com/default-hospital.png'
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
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

hospitalSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Hospital = model('Hospital', hospitalSchema);
export default Hospital;