import express from 'express';
import {getAllUser,updateUser,finduser} from "../../controller/user.js"
const router = express.Router();

router.get('/',getAllUser)
router.put('/:userId', updateUser);
router.get('/getUser', finduser);


export default router;
