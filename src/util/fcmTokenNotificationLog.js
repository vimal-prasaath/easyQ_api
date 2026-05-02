import FCMToken from '../model/fcmToken.js';

/** Keep last N entries per device token document to bound document size */
const MAX_NOTIFICATIONS_SENT = 200;

/**
 * Persist one outbound FCM payload on the token row (audit trail per device).
 * @param {import('mongoose').Types.ObjectId|string} tokenDocId - FCMToken document _id
 * @param {object} entry - Serializable fields (notification, data, ids, messageId)
 */
export async function appendNotificationSentToToken(tokenDocId, entry = {}) {
    if (!tokenDocId) return;

    const doc = {
        sentAt: entry.sentAt instanceof Date ? entry.sentAt : new Date(),
        messageId: entry.messageId ?? undefined,
        kind: entry.kind ?? entry?.data?.type ?? undefined,
        notification: entry.notification ?? undefined,
        data: entry.data ?? undefined,
        appointmentId: entry.appointmentId ?? entry?.data?.appointmentId ?? undefined,
        patientId: entry.patientId ?? undefined,
        hospitalId: entry.hospitalId ?? undefined,
        doctorId: entry.doctorId ?? undefined,
        travelTimeMinutes: entry.travelTimeMinutes ?? undefined,
        suggestedDepartureTime: entry.suggestedDepartureTime ?? undefined,
        batchNumber: entry.batchNumber ?? undefined,
        meta: entry.meta ?? undefined,
    };

    try {
        await FCMToken.updateOne(
            { _id: tokenDocId },
            {
                $push: {
                    notificationsSent: {
                        $each: [doc],
                        $slice: -MAX_NOTIFICATIONS_SENT,
                    },
                },
            }
        );
    } catch {
        // Never fail the send path because logging failed
    }
}
