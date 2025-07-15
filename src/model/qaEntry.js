import mongoose from 'mongoose';

const qaEntrySchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        text: true
    },
    answer: {
        type: String,
        required: true,
        trim: true,
        text: true
    },
    category: {
        type: String,
        required: false,
        trim: true,
        default: 'General',
        lowercase: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true
});

qaEntrySchema.index({ question: 'text', answer: 'text', category: 'text', tags: 'text' });

const QAEntry = mongoose.model('QAEntry', qaEntrySchema);

export default QAEntry;
