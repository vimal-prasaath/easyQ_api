import express from 'express'
import {qrGeneator , getQRCode} from '../../controller/qrgeneratorControllr.js'
const router=express.Router()

router.post('/',qrGeneator)

router.get('/getdetails',getQRCode)

export default router