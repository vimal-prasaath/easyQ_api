import express from "express"
import { login } from "../../controller/login.js"
const router=express.Router()
router.get('/',login)

export default router