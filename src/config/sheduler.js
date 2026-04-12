import cron from 'node-cron';
import appointments from "../model/appointment.js"
import UserToken from "../model/fcmModel.js"
import admin from './firebaseAdmin.js';
import { logInfo, logError } from './logger.js';

// Fixed 2-hour reminder scheduler
cron.schedule('*/1 * * * *', async () => {
    try {
        const now = new Date();
        const targetTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours ahead
        const windowEnd = new Date(targetTime.getTime() + 60000); // 1 minute window
        console.log('targetTime', targetTime);
        console.log('windowEnd', windowEnd);
        // Find appointments that need 2-hour reminders
        const appointmentsToRemind = await appointments.find({
            appointmentDate: {
                $gte: new Date(targetTime.getFullYear(), targetTime.getMonth(), targetTime.getDate()),
                $lt: new Date(windowEnd.getFullYear(), windowEnd.getMonth(), windowEnd.getDate() + 1)
            },
            appointmentTime: {
                $gte: targetTime.getHours() * 100 + targetTime.getMinutes(),
                $lt: windowEnd.getHours() * 100 + windowEnd.getMinutes()
            },
            reminderSent: { $ne: true },
            status: 'Scheduled'
        });

        logInfo('Scheduler check', { 
            targetTime: targetTime.toISOString(),
            appointmentsFound: appointmentsToRemind.length 
        });

        for (const appt of appointmentsToRemind) {
            try {
                // Find user FCM tokens by userId (not patientId)
                const userTokens = await UserToken.find({ userId: appt.patientId, isActive: true });
                
                if (userTokens.length > 0) {
                    // Send to all active tokens for the user
                    for (const tokenDoc of userTokens) {
                        await admin.messaging().send({
                            token: tokenDoc.fcmToken,
                            notification: {
                                title: 'Upcoming Appointment',
                                body: `Your appointment is in 2 hours. We'll send you updates about when to leave.`
                            },
                            data: {
                                appointmentId: appt.appointmentId,
                                type: '2hour_reminder',
                                deeplink: `app://appointment/${appt.appointmentId}`
                            }
                        });
                    }

                    // Mark reminder as sent
                    await appointments.updateOne(
                        { appointmentId: appt.appointmentId },
                        { reminderSent: true }
                    );

                    logInfo('2-hour reminder sent', {
                        appointmentId: appt.appointmentId,
                        patientId: appt.patientId,
                        tokensSent: userTokens.length
                    });
                }
            } catch (error) {
                logError('Failed to send reminder', {
                    appointmentId: appt.appointmentId,
                    error: error.message
                });
            }
        }
    } catch (error) {
        logError('Scheduler error', { error: error.message });
    }
});
