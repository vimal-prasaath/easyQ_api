import express from 'express';
import userRouter from './user/index.js';
import hospitalRouter from './hospital/index.js'
import doctorRouter from './doctor/index.js';
import appointmentRouter from './appoitment/index.js'
const router = express.Router();

router.use('/user', userRouter);

router.use('/hospital',hospitalRouter)

router.use('/doctor',doctorRouter)

router.use('/appoitment',appointmentRouter)

export default router;
