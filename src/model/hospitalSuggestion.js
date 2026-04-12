import mongoose from 'mongoose';

const hospitalSuggestionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User',
        index: true
    },
    hospitalName: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        street: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        pincode: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            trim: true
        }
    },
    placeId: {
        type: String,
        trim: true
    },
    fullAddress: {
        type: String,
        trim: true
    },
    coordinates: {
        lat: {
            type: Number
        },
        lng: {
            type: Number
        }
    },
    suggestedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
hospitalSuggestionSchema.index({ userId: 1, suggestedAt: -1 });
hospitalSuggestionSchema.index({ hospitalName: 1, 'location.city': 1, 'location.state': 1 });

const HospitalSuggestion = mongoose.model('HospitalSuggestion', hospitalSuggestionSchema);

export default HospitalSuggestion;



