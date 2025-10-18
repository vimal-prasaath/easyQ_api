import cron from 'node-cron';
import { DoctorDelayService } from '../services/doctorDelayService.js';
import { logInfo, logError } from './logger.js';

/**
 * Automatic delay cleanup scheduler
 * Runs every hour to clean up expired delays
 */
cron.schedule('0 * * * *', async () => {
    try {
        logInfo('Starting automatic delay cleanup...');
        const result = await DoctorDelayService.cleanupExpiredDelays();
        
        if (result.success && result.totalDelaysCleaned > 0) {
            logInfo('Automatic delay cleanup completed', {
                totalDelaysCleaned: result.totalDelaysCleaned,
                doctorsAffected: result.doctorsAffected,
                cleanupTime: result.cleanupTime
            });
        } else {
            logInfo('Automatic delay cleanup completed - no expired delays found');
        }
    } catch (error) {
        logError('Error in automatic delay cleanup scheduler', { 
            error: error.message,
            stack: error.stack
        });
    }
});

logInfo('Delay cleanup scheduler started', {
    schedule: 'Every hour at minute 0',
    description: 'Automatically cleans up expired doctor delays'
});
