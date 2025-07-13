import express from "express"
import {createQA,getQAs,updateQA,deleteQA} from "../../controller/helpCenter.js"
import authorizeRoles from "../../middleware/authorization.js";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";

const router= express.Router()

router.post('/',authorizeRoles,createQA)
router.get('/',authorizeOwnerOrAdmin,getQAs)
router.put('/:id',authorizeRoles,updateQA)
router.delete('/:id',authorizeRoles,deleteQA)


export default router