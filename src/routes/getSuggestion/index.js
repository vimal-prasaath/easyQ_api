import express from "express"
import {getSimilarAppointmentSuggestions} from "../../controller/suggestion.js"
const router= express.Router()

router.get('/',getSimilarAppointmentSuggestions)

export default router