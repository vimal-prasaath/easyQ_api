import express from 'express';
import {
    createReview,
    getReviewsByDoctor,
    getDoctorRatingSummary,
    updateReview,
    updatePatientReview,
    deleteReview,
    moderateReview,
    bulkModerateReviews,
    getSuspiciousReviews
} from '../../controller/review.js';
import authorizeRoles from "../../middleware/authorization.js";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
const router = express.Router();

/**
 * @swagger
 * /api/doctor/reviews:
 *   post:
 *     summary: Create a new doctor review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - patientId
 *               - rating
 *               - comment
 *             properties:
 *               doctorId:
 *                 type: string
 *               patientId:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Invalid input data
 *
 * /api/reviews/doctor/{doctorId}:
 *   get:
 *     summary: Get reviews for a doctor
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews for the doctor
 *       404:
 *         description: Doctor not found
 *
 * /api/reviews/doctor/{doctorId}/summary:
 *   get:
 *     summary: Get doctor rating summary
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor rating summary
 *       404:
 *         description: Doctor not found
 *
 * /api/reviews/patient/{patientId}/doctor/{doctorId}:
 *   put:
 *     summary: Update a review by patient for a doctor
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: doctorId
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
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 *       404:
 *         description: Review not found
 *
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
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
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 *       404:
 *         description: Review not found
 *
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 *       404:
 *         description: Review not found
 *
 * /api/review/{reviewId}/moderate:
 *   patch:
 *     summary: Moderate a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
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
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, pending]
 *     responses:
 *       200:
 *         description: Review moderated
 *       404:
 *         description: Review not found
 *
 * /api/review/bulk/moderate:
 *   patch:
 *     summary: Bulk moderate reviews
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, pending]
 *     responses:
 *       200:
 *         description: Bulk moderation completed
 *       404:
 *         description: Some reviews not found
 *
 * /api/review/admin/suspicious:
 *   get:
 *     summary: Get suspicious reviews
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: List of suspicious reviews
 */
router.post('/',authorizeOwnerOrAdmin, createReview);
router.get('/doctor/:doctorId',authorizeOwnerOrAdmin, getReviewsByDoctor);
router.get('/doctor/:doctorId/summary',authorizeOwnerOrAdmin, getDoctorRatingSummary);
router.put('/patient/:patientId/doctor/:doctorId',authorizeOwnerOrAdmin, updatePatientReview);
router.put('/:reviewId', authorizeOwnerOrAdmin,updateReview);
router.delete('/:reviewId',authorizeOwnerOrAdmin, deleteReview);
router.patch('/:reviewId/moderate', moderateReview);
router.patch('/bulk/moderate', bulkModerateReviews);
router.get('/admin/suspicious', getSuspiciousReviews);

export default router;