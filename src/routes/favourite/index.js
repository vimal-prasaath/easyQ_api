import express from "express"
import { postfavourite, getfavourite} from '../../controller/favourite.js'
 
const router=express.Router()

/**
 * @swagger
 * /api/favourite/addfav:
 *   post:
 *     summary: Add or update a hospital as favourite for a user
 *     tags: [Favourites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - hospitalId
 *               - favourite
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user
 *               hospitalId:
 *                 type: string
 *                 description: The ID of the hospital
 *               favourite:
 *                 type: boolean
 *                 description: Whether the hospital is a favourite
 *     responses:
 *       200:
 *         description: Favourite status updated
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User or hospital not found
 */

/**
 * @swagger
 * /api/favourite/{userId}/{hospitalId}:
 *   get:
 *     summary: Get favourite status for a hospital by user
 *     tags: [Favourites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the hospital
 *     responses:
 *       200:
 *         description: Favourite status retrieved
 *       404:
 *         description: User or hospital not found
 */

router.post('/addfav',postfavourite)

router.get('/:userId/:hospitalId',getfavourite)

export default router
