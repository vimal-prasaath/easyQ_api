import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const notificationHistorySchema = new Schema({
    // Notification details
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    body: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Body cannot exceed 1000 characters']
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    
    // Sender information
    sentBy: {
        superAdminId: {
            type: String,
            required: true,
            ref: 'SuperAdmin'
        },
        superAdminName: {
            type: String,
            trim: true
        }
    },
    
    // Recipient information
    recipientType: {
        type: String,
        enum: ['all_patients', 'specific_patients', 'hospital'],
        default: 'all_patients'
    },
    recipientCount: {
        type: Number,
        default: 0
    },
    successfulCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'sending', 'completed', 'failed'],
        default: 'pending'
    },
    
    // Error information
    errorMessage: {
        type: String,
        trim: true
    },
    
    // Timestamps
    sentAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationHistorySchema.index({ 'sentBy.superAdminId': 1 });
notificationHistorySchema.index({ sentAt: -1 });
notificationHistorySchema.index({ status: 1 });
notificationHistorySchema.index({ recipientType: 1 });

const NotificationHistory = model('NotificationHistory', notificationHistorySchema);

export default NotificationHistory;

