    import express from 'express';
    import userRouter from './user/index.js';
    import hospitalRouter from './hospital/index.js'
    import doctorRouter from './doctor/index.js';
    import appointmentRouter from './appoitment/index.js'
    import searchRouter from './search/index.js';
    import  qrRouter  from '../routes/qrGenerator/index.js';
    import uploadRouter from '../routes/uploadFiles/index.js'
    import favouriteRouter from '../routes/favourite/index.js';
    const router = express.Router();

    router.use('/user', userRouter);

    router.use('/hospital',hospitalRouter)

    router.use('/doctor',doctorRouter)

    router.use('/appoitment',appointmentRouter)

    router.use('/search' , searchRouter)

    router.use('/qrgenerator' , qrRouter)

    router.use('/uploadfile' , uploadRouter)

    router.use('/favourite',favouriteRouter)

    export default router;
