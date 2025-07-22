import express from "express"
import {getSimilarAppointmentSuggestions} from "../../controller/suggestion.js"
import authorizeRoles from "../../middleware/authorization.js";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
const router= express.Router()

/**
 * @swagger
 * /api/getSuggestion:
 *   get:
 *     summary: Get similar appointment suggestions for a patient
 *     tags: [Suggestions]
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the patient
 *     responses:
 *       200:
 *         description: List of similar appointment suggestions
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Patient not found
 */
router.get('/',authorizeOwnerOrAdmin,getSimilarAppointmentSuggestions)

export default router