import express from 'express';
import {getAllUser,updateUser,finduser, deleteUser , resetUserPassword , activateUser, getAllInActiveUser} from "../../controller/user.js"
import authorizeRoles from '../../middleware/authorization.js';
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js"
const router = express.Router();

router.get('/', authorizeRoles, getAllUser)
router.get('/admins',authorizeRoles,getAllInActiveUser)

router.put('/:userId', authorizeOwnerOrAdmin, updateUser);
router.put('/activate/:userId',authorizeRoles, activateUser);
router.put('/reset-password', authorizeOwnerOrAdmin, resetUserPassword);

router.get('/getUser', authorizeOwnerOrAdmin, finduser);
router.delete('/delete/:userId',  authorizeOwnerOrAdmin, deleteUser)


export default router;
