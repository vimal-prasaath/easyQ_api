import express from 'express';
import {getAllUser,updateUser,finduser, deleteUser} from "../../controller/user.js"
const router = express.Router();

router.get('/',getAllUser)
router.put('/:userId', updateUser);
router.get('/getUser', finduser);
router.delete('/delete',deleteUser)


export default router;
