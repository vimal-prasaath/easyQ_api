import express from 'express'
import {uploadRouter} from "../../controller/uploadFile.js"
const router = express.Router()

router.post('/',uploadRouter)

router.get('/userId',)

export default router