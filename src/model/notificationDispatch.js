import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const notificationDispatchSchema = new Schema(
  {
    // Correlation / identity
    appointmentId: { type: String, index: true },
    patientId: { type: String, index: true },
    hospitalId: { type: String, index: true },
    doctorId: { type: String, index: true },

    // Notification classification
    type: {
      type: String,
      required: true,
      enum: [
        'location_based_departure',
        'batch_departure_notification',
        '2hour_reminder',
        'manual_2hour_reminder',
      ],
      index: true,
    },
    batchNumber: { type: Number, index: true },

    // Timing / decision inputs
    appointmentAt: { type: Date, index: true },
    suggestedDepartureTime: { type: Date, index: true },
    travelTimeMinutes: { type: Number },

    // FCM delivery info (aggregated, not per-token)
    tokensTargeted: { type: Number, default: 0 },
    tokensSent: { type: Number, default: 0 },

    // Outcome
    status: {
      type: String,
      enum: ['sent', 'skipped', 'failed'],
      default: 'sent',
      index: true,
    },
    skipReason: { type: String },
    errorMessage: { type: String },

    // Timestamps
    dispatchedAt: { type: Date, default: Date.now, index: true },

    // Raw additional context (keep small)
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Idempotency: avoid duplicates for the same appointment/type/batch in normal operation.
notificationDispatchSchema.index(
  { appointmentId: 1, type: 1, batchNumber: 1 },
  { unique: true, sparse: true }
);

const NotificationDispatch = model('NotificationDispatch', notificationDispatchSchema);

export default NotificationDispatch;

