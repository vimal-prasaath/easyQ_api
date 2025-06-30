import express from "express"
import {searchHospital} from '../../controller/searchController.js'
const router=express.Router()
router.get('/',searchHospital)

export default router