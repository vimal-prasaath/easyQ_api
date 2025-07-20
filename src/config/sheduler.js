import cron from 'node-cron';
import appointments from "../model/appointment.js"
import UserToken from "../model/fcmModel.js"
import admin from './firebase.js';
cron.schedule('*/1 * * * *', async () => {
    const now = new Date()
    const targetTime = new Date(now.getTime() + 30 * 60 * 1000);
    const appointment = await appointments.find({
        time: { $gte: targetTime, $lt: new Date(targetTime.getTime() + 60000) }
    });
    appointment.forEach(async (appt) => {
        const user = await UserToken.findOne({ patientId: appt.patientId });
        if (user?.fcmToken) {
            await admin.messaging().send({
                token: user.fcmToken,
                notification: {
                    title: 'Upcoming Appointment',
                    body: `Hi, your appointment is in 30 minutes.`
                }
            });
        }

    })
})