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

const router = express.Router();

router.post('/', createReview);
router.get('/doctor/:doctorId', getReviewsByDoctor);
router.get('/doctor/:doctorId/summary', getDoctorRatingSummary);
router.put('/patient/:patientId/doctor/:doctorId', updatePatientReview);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);
router.patch('/:reviewId/moderate', moderateReview);
router.patch('/bulk/moderate', bulkModerateReviews);
router.get('/admin/suspicious', getSuspiciousReviews);

export default router;