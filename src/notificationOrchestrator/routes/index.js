import express from 'express';
import { etaController } from '../controller/etaController.js';
import { autocompleteController } from '../controller/placesController.js';
import { sendManual2HourReminder, sendLocationBasedNotification, sendDoctorDelayNotification } from '../../controller/notificationOrchestratorController.js';
import { processETABatches, detectNoShows, handleCheckIn, advanceToNextBatch } from '../../controller/batchOrchestratorController.js';
import { orchestratorRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Open API: Calculate ETA/distance between origin and destination
router.post('/eta', orchestratorRateLimit, etaController);
router.post('/places/autocomplete', orchestratorRateLimit, autocompleteController);

// Manual notification testing APIs
router.post('/notifications/2hour-reminder', orchestratorRateLimit, sendManual2HourReminder);
router.post('/notifications/location-based', orchestratorRateLimit, sendLocationBasedNotification);
router.post('/notifications/doctor-delay', orchestratorRateLimit, sendDoctorDelayNotification);

// Batch orchestration APIs
router.post('/batch/process-eta', orchestratorRateLimit, processETABatches);
router.post('/batch/detect-noshow', orchestratorRateLimit, detectNoShows);
router.post('/batch/checkin', orchestratorRateLimit, handleCheckIn);
router.post('/batch/advance', orchestratorRateLimit, advanceToNextBatch);

export default router;


