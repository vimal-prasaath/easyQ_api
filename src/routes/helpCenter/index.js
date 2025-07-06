import express from "express"
import {createQA,getQAs,updateQA,deleteQA} from "../../controller/helpCenter.js"
const router= express.Router()

router.post('/',createQA)
router.get('/',getQAs)
router.put('/:id',updateQA)
router.delete('/:id',deleteQA)


export default router