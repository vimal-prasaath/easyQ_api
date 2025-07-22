/**
 * @swagger
 * /api/qa:
 *   post:
 *     summary: Create a new Q&A entry
 *     tags: [HelpCenter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Q&A entry created
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Q&A already exists
 *
 *   get:
 *     summary: Get all Q&A entries
 *     tags: [HelpCenter]
 *     responses:
 *       200:
 *         description: List of Q&A entries
 *       500:
 *         description: Server error
 *
 * /api/qa/{id}:
 *   put:
 *     summary: Update a Q&A entry
 *     tags: [HelpCenter]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Q&A entry updated
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Q&A not found
 *
 *   delete:
 *     summary: Delete a Q&A entry
 *     tags: [HelpCenter]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Q&A entry deleted
 *       404:
 *         description: Q&A not found
 */
import express from "express"
import {createQA,getQAs,updateQA,deleteQA} from "../../controller/helpCenter.js"
import authorizeRoles from "../../middleware/authorization.js";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";

const router= express.Router()

router.post('/',authorizeRoles,createQA)
router.get('/',authorizeOwnerOrAdmin,getQAs)
router.put('/:id',authorizeRoles,updateQA)
router.delete('/:id',authorizeRoles,deleteQA)


export default router