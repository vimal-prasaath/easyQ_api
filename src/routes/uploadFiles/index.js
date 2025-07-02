import express from 'express'
import {uploadfile} from "../../controller/uploadFile.js"
const router = express.Router()

router.post('/',uploadfile)

// router.get('/userId',)

export default router