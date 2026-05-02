import cron from 'node-cron';
import appointments from "../model/appointment.js";
import FCMToken from "../model/fcmToken.js";
import admin from './firebaseAdmin.js';
import { logInfo, logError } from './logger.js';
import { appendNotificationSentToToken } from '../util/fcmTokenNotificationLog.js';
import { appointmentStartUtcFromParts } from '../util/appointmentInstant.js';

/** Match cron minute + small clock drift */
const REMINDER_MATCH_WINDOW_MS = 90 * 1000;

/** Local: NODE_ENV != production OR DEBUG_SCHEDULERS=1. Per-row eval: DEBUG_SCHEDULERS_VERBOSE=1 */
const schedLog = (...args) => {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_SCHEDULERS === '1' || process.env.DEBUG_SCHEDULERS === 'true') {
        console.log('[EasyQ 2h-scheduler]', new Date().toISOString(), ...args);
    }
};
const schedVerbose = () =>
    process.env.DEBUG_SCHEDULERS_VERBOSE === '1' || process.env.DEBUG_SCHEDULERS_VERBOSE === 'true';

// Fixed 2-hour reminder scheduler (runs every minute)
cron.schedule('*/1 * * * *', async () => {
    try {
        const now = new Date();

        // Candidates in a modest date range (avoid full collection scan)
        const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const to = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

        schedLog('tick', { from: from.toISOString(), to: to.toISOString() });

        const candidates = await appointments.find({
            reminderSent: { $ne: true },
            status: 'Scheduled',
            appointmentDate: { $gte: from, $lte: to },
        });

        schedLog('candidates (raw count)', candidates.length);

        const appointmentsToRemind = [];
        for (const appt of candidates) {
            const start = appointmentStartUtcFromParts(
                appt.appointmentDate,
                appt.appointmentTime
            );
            if (!start || Number.isNaN(start.getTime())) {
                schedLog('skip — bad start', { appointmentId: appt.appointmentId, time: appt.appointmentTime });
                continue;
            }

            const remindAt = new Date(start.getTime() - 2 * 60 * 60 * 1000);
            const inWindow =
                now.getTime() >= remindAt.getTime() &&
                now.getTime() < remindAt.getTime() + REMINDER_MATCH_WINDOW_MS;

            if (schedVerbose()) {
                schedLog('eval', {
                    appointmentId: appt.appointmentId,
                    patientId: appt.patientId,
                    appointmentTime: appt.appointmentTime,
                    startUtc: start.toISOString(),
                    remindAtUtc: remindAt.toISOString(),
                    inWindow,
                });
            }

            if (inWindow) {
                appointmentsToRemind.push(appt);
            }
        }

        logInfo('Scheduler check', {
            mode: '2hour_reminder_IST',
            currentTime: now.toISOString(),
            candidatesScanned: candidates.length,
            appointmentsToRemind: appointmentsToRemind.length,
        });

        for (const appt of appointmentsToRemind) {
            try {
                schedLog('sending 2h reminder', { appointmentId: appt.appointmentId, patientId: appt.patientId });

                const userTokens = await FCMToken.find({
                    userId: appt.patientId,
                    isActive: true,
                });

                schedLog('FCM tokens for user', { patientId: appt.patientId, count: userTokens.length });

                if (userTokens.length > 0) {
                    for (const tokenDoc of userTokens) {
                        const fcmPayload = {
                            token: tokenDoc.fcmToken,
                            notification: {
                                title: 'Upcoming Appointment',
                                body: `Your appointment is in 2 hours. We'll send you updates about when to leave.`,
                            },
                            data: {
                                appointmentId: appt.appointmentId,
                                type: '2hour_reminder',
                                deeplink: `app://appointment/${appt.appointmentId}`,
                            },
                        };
                        const messageId = await admin.messaging().send(fcmPayload);
                        await appendNotificationSentToToken(tokenDoc._id, {
                            messageId,
                            notification: fcmPayload.notification,
                            data: fcmPayload.data,
                            kind: '2hour_reminder',
                            appointmentId: appt.appointmentId,
                            patientId: appt.patientId,
                        });
                    }

                    await appointments.updateOne(
                        { appointmentId: appt.appointmentId },
                        { reminderSent: true }
                    );

                    logInfo('2-hour reminder sent', {
                        appointmentId: appt.appointmentId,
                        patientId: appt.patientId,
                        tokensSent: userTokens.length,
                    });
                    schedLog('done', { appointmentId: appt.appointmentId, tokensSent: userTokens.length, reminderSent: true });
                } else {
                    schedLog('no FCM tokens — not marking reminderSent', { appointmentId: appt.appointmentId, patientId: appt.patientId });
                }
            } catch (error) {
                logError('Failed to send reminder', {
                    appointmentId: appt.appointmentId,
                    error: error.message,
                });
                schedLog('error in appt loop', { appointmentId: appt.appointmentId, error: error.message });
            }
        }
    } catch (error) {
        logError('Scheduler error', { error: error.message });
        schedLog('FATAL', { error: error.message });
    }
});
