import express from "express"
import {searchHospital} from '../../controller/searchController.js'
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
import authorizeRoles from "../../middleware/authorization.js";
const router=express.Router()

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search for hospitals based on various criteria
 *     tags: [Search]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user performing the search
 *                 required: true
 *               name:
 *                 type: string
 *                 description: Hospital name to search for
 *               city:
 *                 type: string
 *                 description: City where the hospital is located
 *               state:
 *                 type: string
 *                 description: State where the hospital is located
 *               hospitalType:
 *                 type: string
 *                 description: Type of hospital
 *               specialization:
 *                 type: string
 *                 description: Medical specialization to search for
 *               coordinates:
 *                 type: array
 *                 description: Geographic coordinates [longitude, latitude] for proximity search
 *                 items:
 *                   type: number
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hospital'
 *                 lastSearch:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/',authorizeOwnerOrAdmin,searchHospital)

export default router