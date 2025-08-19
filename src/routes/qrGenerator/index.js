
import express from 'express'
import {qrGeneator , getQRCode} from '../../controller/qrgeneratorControllr.js'
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
import authorizeRoles from "../../middleware/authorization.js";
const router=express.Router()

router.post('/',authorizeOwnerOrAdmin,qrGeneator)
router.get('/getdetails',authorizeRoles,getQRCode)

export default router