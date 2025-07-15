import express from 'express';
import authenticate from '../middleware/auth.js';
import authorizeUserUpdate from '../middleware/authorization.js'
import { searchRateLimit } from '../middleware/rateLimiter.js';
import userRouter from './user/index.js';
import hospitalRouter from './hospital/index.js'
import doctorRouter from './doctor/index.js';
import appointmentRouter from './appoitment/index.js'
import searchRouter from './search/index.js';
import  qrRouter  from '../routes/qrGenerator/index.js';
import uploadRouter from '../routes/uploadFiles/index.js'
import favouriteRouter from '../routes/favourite/index.js';
import helpCenter from '../routes/helpCenter/index.js'
import getSuggestionRouter from '../routes/getSuggestion/index.js'
import patientNotesRouter from '../routes/patientNotes/index.js'
import reviewRouter from '../routes/review/index.js'

const router = express.Router();

router.use('/user', authenticate,  userRouter);
router.use('/hospital', authenticate, hospitalRouter);
router.use('/doctor', authenticate, doctorRouter);
router.use('/appoitment', authenticate, appointmentRouter);
router.use('/search', authenticate, searchRateLimit, searchRouter); 
router.use('/qrgenerator', authenticate, qrRouter);
router.use('/uploadfile', authenticate, uploadRouter);
router.use('/favourite', authenticate, favouriteRouter);
router.use('/qa', authenticate, helpCenter);
router.use('/getSuggestion', authenticate, getSuggestionRouter);
router.use('/patient-notes', authenticate, patientNotesRouter);
router.use('/reviews', authenticate, reviewRouter);


export default router;
