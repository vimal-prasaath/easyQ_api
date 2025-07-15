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