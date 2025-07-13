import express from "express"
import {getSimilarAppointmentSuggestions} from "../../controller/suggestion.js"
import authorizeRoles from "../../middleware/authorization.js";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
const router= express.Router()

router.get('/',authorizeOwnerOrAdmin,getSimilarAppointmentSuggestions)

export default router