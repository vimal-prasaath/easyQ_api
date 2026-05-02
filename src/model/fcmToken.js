import mongoose from "mongoose";

const fcmTokenSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    fcmToken: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    deviceInfo: {
        platform: {
            type: String,
            enum: ['ios', 'android', 'web'],
            default: 'android'
        },
        appVersion: {
            type: String,
            default: '1.0.0'
        },
        deviceModel: {
            type: String,
            default: 'Unknown'
        },
        osVersion: {
            type: String,
            default: 'Unknown'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },

    /** Last outbound FCM notifications for this device (capped server-side). */
    notificationsSent: [
        {
            sentAt: { type: Date, default: Date.now },
            messageId: { type: String },
            kind: { type: String },
            notification: {
                title: String,
                body: String,
            },
            data: { type: mongoose.Schema.Types.Mixed },
            appointmentId: String,
            patientId: String,
            hospitalId: String,
            doctorId: String,
            travelTimeMinutes: Number,
            suggestedDepartureTime: String,
            batchNumber: String,
            meta: { type: mongoose.Schema.Types.Mixed },
        },
    ],
}, {
    timestamps: true
});

// Index for efficient queries
fcmTokenSchema.index({ userId: 1, isActive: 1 });
fcmTokenSchema.index({ fcmToken: 1 }, { unique: true });

// Update the updatedAt field before saving
fcmTokenSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to find active tokens for a user
fcmTokenSchema.statics.findActiveTokensByUserId = function(userId) {
    return this.find({ userId, isActive: true }).sort({ lastUsed: -1 });
};

// Static method to deactivate old tokens
fcmTokenSchema.statics.deactivateOldTokens = function(userId, keepLatest = 3) {
    return this.find({ userId, isActive: true })
        .sort({ lastUsed: -1 })
        .skip(keepLatest)
        .updateMany({}, { isActive: false });
};

const FCMToken = mongoose.model('FCMToken', fcmTokenSchema);

export default FCMToken;

