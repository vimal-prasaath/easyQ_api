import cron from 'node-cron';
import { BatchOrchestrator } from '../services/batchOrchestrator.js';
import { logInfo, logError } from './logger.js';

// ETA-based batch notification scheduler
// Runs every 2 minutes to check for appointments that need departure notifications
cron.schedule('*/2 * * * *', async () => {
    try {
        logInfo('Starting ETA-based batch processing');
        const result = await BatchOrchestrator.processETABasedNotifications();
        logInfo('ETA-based batch processing completed', {
            notificationsTriggered: result.notificationsTriggered
        });
    } catch (error) {
        logError('ETA-based batch processing failed', { error: error.message });
    }
});

// No-show detection scheduler
// Runs every 5 minutes to check for no-shows and advance batches
cron.schedule('*/5 * * * *', async () => {
    try {
        logInfo('Starting no-show detection');
        const result = await BatchOrchestrator.handleNoShows();
        logInfo('No-show detection completed', {
            noShowsDetected: result.noShowsDetected
        });
    } catch (error) {
        logError('No-show detection failed', { error: error.message });
    }
});

logInfo('Batch orchestration schedulers started', {
    etaProcessingInterval: 'Every 2 minutes',
    noShowDetectionInterval: 'Every 5 minutes'
});
