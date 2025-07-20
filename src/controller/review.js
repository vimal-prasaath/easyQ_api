
import Review from "../model/review.js";
import Doctor from "../model/doctor.js";
import { EasyQError } from '../config/error.js'; 
import { httpStatusCode } from '../util/statusCode.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { ValidationErrorHandler } from '../util/errorHandler.js';

// Input sanitization utility
function sanitizeInput(text) {
    if (!text || typeof text !== 'string') return text;
    
    // Remove potential XSS patterns
    return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
}

// Rate limiting check (simple implementation)
const reviewAttempts = new Map(); // In production, use Redis or database
function checkRateLimit(patientId) {
    const key = `review_${patientId}`;
    const now = Date.now();
    const attempts = reviewAttempts.get(key) || [];
    
    // Remove attempts older than 1 hour
    const recentAttempts = attempts.filter(time => (now - time) < 60 * 60 * 1000);
    
    if (recentAttempts.length >= 3) { // Max 3 reviews per hour
        return false;
    }
    
    recentAttempts.push(now);
    reviewAttempts.set(key, recentAttempts);
    return true;
}

// Create a new review for doctor
export async function createReview(req, res, next) {
    const data = req.body;
    try {
        const inputErrors = ValidationErrorHandler.validateReviewInput(data);
        if (inputErrors.length > 0) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ValidationErrorHandler.createErrorResponse(inputErrors, 'InputValidationError')
            );
        }

        if (!checkRateLimit(data.patientId)) {
            return next(new EasyQError(
                'TooManyRequests',
                httpStatusCode.TOO_MANY_REQUESTS || 429,
                true,
                'Too many review attempts. Please try again later.'
            ));
        }

        const doctorExists = await Doctor.findOne({ doctorId: data.doctorId });
        if (!doctorExists) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Doctor with ID ${data.doctorId} not found.`
            ));
        }

        const existingReview = await Review.findOne({ 
            doctorId: data.doctorId, 
            patientId: data.patientId 
        });
        
        if (existingReview) {
            return next(new EasyQError(
                'ConflictError',
                httpStatusCode.CONFLICT,
                true,
                'You have already reviewed this doctor. You can update your existing review instead.'
            ));
        }

        const review = await Review.create(data);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Review created successfully",
            data: {
                review: review,
                reviewId: review.reviewId
            },
            statusCode: httpStatusCode.CREATED
        });
        
        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'createReview', next);
    }
}

// Get reviews by doctor ID
export async function getReviewsByDoctor(req, res, next) {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, status = 'Approved', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    try {
        if (!doctorId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required.'
            ));
        }

        const filter = { doctorId, status };
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const skip = (page - 1) * limit;
        const reviews = await Review.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select(ResponseFormatter.getSelectFields());

        const total = await Review.countDocuments(filter);
        const meta = ResponseFormatter.formatPaginationMeta(page, limit, total);
        
        const ratingStats = await Review.aggregate([
            { $match: { doctorId, status: 'Approved' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$overallRating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 };

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Reviews retrieved successfully",
            data: {
                reviews: reviews,
                doctorId: doctorId,
                statistics: {
                    averageRating: Math.round(stats.averageRating * 10) / 10,
                    totalReviews: stats.totalReviews
                }
            },
            meta: meta,
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'getReviewsByDoctor', next);
    }
}

// Get doctor rating summary
export async function getDoctorRatingSummary(req, res, next) {
    const { doctorId } = req.params;

    try {
        if (!doctorId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required.'
            ));
        }

        const summary = await Review.aggregate([
            { $match: { doctorId, status: 'Approved' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$overallRating' },
                    totalReviews: { $sum: 1 },
                    avgCommunication: { $avg: '$categoryRatings.communication' },
                    avgExpertise: { $avg: '$categoryRatings.expertise' },
                    avgPunctuality: { $avg: '$categoryRatings.punctuality' },
                    avgBedSideManner: { $avg: '$categoryRatings.bedSideManner' },
                    recommendationCount: {
                        $sum: { $cond: ['$wouldRecommend', 1, 0] }
                    },
                    ratingDistribution: {
                        $push: '$overallRating'
                    }
                }
            },
            {
                $addFields: {
                    recommendationPercentage: {
                        $cond: [
                            { $eq: ['$totalReviews', 0] },
                            0,
                            {
                                $multiply: [
                                    { $divide: ['$recommendationCount', '$totalReviews'] },
                                    100
                                ]
                            }
                        ]
                    }
                }
            }
        ]);

        if (!summary.length) {
            const response = ResponseFormatter.formatSuccessResponse({
                message: "No reviews found for this doctor",
                data: {
                    doctorId: doctorId,
                    summary: {
                        averageRating: 0,
                        totalReviews: 0,
                        recommendationPercentage: 0,
                        categoryAverages: {
                            communication: 0,
                            expertise: 0,
                            punctuality: 0,
                            bedSideManner: 0
                        },
                        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    }
                },
                statusCode: httpStatusCode.OK
            });
            return res.status(httpStatusCode.OK).json(response);
        }

        const data = summary[0];
        
        const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        data.ratingDistribution.forEach(rating => {
            ratingDist[Math.floor(rating)] = (ratingDist[Math.floor(rating)] || 0) + 1;
        });

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Doctor rating summary retrieved successfully",
            data: {
                doctorId: doctorId,
                summary: {
                    averageRating: Math.round(data.averageRating * 10) / 10,
                    totalReviews: data.totalReviews,
                    recommendationPercentage: Math.round(data.recommendationPercentage),
                    categoryAverages: {
                        communication: Math.round((data.avgCommunication || 0) * 10) / 10,
                        expertise: Math.round((data.avgExpertise || 0) * 10) / 10,
                        punctuality: Math.round((data.avgPunctuality || 0) * 10) / 10,
                        bedSideManner: Math.round((data.avgBedSideManner || 0) * 10) / 10
                    },
                    ratingDistribution: ratingDist
                }
            },
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'getDoctorRatingSummary', next);
    }
}

// Update review
export async function updateReview(req, res, next) {
    const { reviewId } = req.params;
    const updates = req.body;

    try {
        if (!reviewId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Review ID is required for update.'
            ));
        }

        if (Object.keys(updates).length === 0) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'No update fields provided.'
            ));
        }

        // Sanitize update fields
       
        if (updates.reviewText) {
            updates.reviewText = sanitizeInput(updates.reviewText);
        }
        if (updates.categories) {
            const categoryFields = ['communication', 'expertise', 'punctuality', 'facilities'];
            for (const field of categoryFields) {
                if (updates.categories[field]) {
                    updates.categories[field] = sanitizeInput(updates.categories[field]);
                }
            }
        }

        const updatedReview = await Review.findOneAndUpdate(
            { reviewId: reviewId },
            { $set: updates },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        ).select(ResponseFormatter.getSelectFields());

        if (!updatedReview) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Review not found.'
            ));
        }

        const response = ResponseFormatter.formatSuccessResponse({
            message: 'Review updated successfully',
            data: {
                review: updatedReview
            },
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);

    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'updateReview', next);
    }
}

// Delete review
export async function deleteReview(req, res, next) {
    const { reviewId } = req.params;

    try {
        if (!reviewId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Review ID is required.'
            ));
        }

        const deletedReview = await Review.findOneAndDelete({ reviewId: reviewId }).select('-_id -__v');
        if (!deletedReview) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Review not found.'
            ));
        }

        res.status(httpStatusCode.OK).json({
            success: true,
            message: "Review deleted successfully",
            data: {
                deletedReview: deletedReview
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to delete review: ${error.message}`
        ));
    }
}

// Admin: Approve/Reject review
export async function moderateReview(req, res, next) {
    const { reviewId } = req.params;
    const { status, adminResponse } = req.body;

    try {
        if (!reviewId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Review ID is required.'
            ));
        }

        if (!['Approved', 'Rejected', 'Hidden'].includes(status)) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Invalid status. Must be Approved, Rejected, or Hidden.'
            ));
        }

        const updateData = { status };
        if (adminResponse) {
            updateData.adminResponse = {
                ...adminResponse,
                respondedAt: new Date()
            };
        }

        const updatedReview = await Review.findOneAndUpdate(
            { reviewId: reviewId },
            { $set: updateData },
            { new: true }
        ).select('-_id -__v');

        if (!updatedReview) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Review not found.'
            ));
        }

        res.status(httpStatusCode.OK).json({
            success: true,
            message: `Review ${status.toLowerCase()} successfully`,
            data: {
                review: updatedReview
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error moderating review: ${error.message}`
        ));
    }
}

// Admin: Bulk moderate reviews
export async function bulkModerateReviews(req, res, next) {
    const { reviewIds, status, adminResponse } = req.body;

    try {
        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Review IDs array is required.'
            ));
        }

        if (!['Approved', 'Rejected', 'Hidden'].includes(status)) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Invalid status. Must be Approved, Rejected, or Hidden.'
            ));
        }

        const updateData = { status };
        if (adminResponse) {
            updateData.adminResponse = {
                ...adminResponse,
                respondedAt: new Date()
            };
        }

        const result = await Review.updateMany(
            { reviewId: { $in: reviewIds } },
            { $set: updateData }
        );

        res.status(httpStatusCode.OK).json({
            success: true,
            message: `${result.modifiedCount} reviews ${status.toLowerCase()} successfully`,
            data: {
                totalRequested: reviewIds.length,
                totalModified: result.modifiedCount,
                status: status
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error bulk moderating reviews: ${error.message}`
        ));
    }
}

// Get reviews with suspicious patterns (for admin review)
export async function getSuspiciousReviews(req, res, next) {
    const { page = 1, limit = 20 } = req.query;

    try {
        const skip = (page - 1) * limit;
        
        // Find suspicious patterns
        const suspiciousReviews = await Review.aggregate([
            {
                $match: {
                    status: 'Pending'
                }
            },
            {
                $addFields: {
                    suspicionScore: {
                        $add: [
                            // Multiple reviews from same IP (if tracked)
                            { $cond: [{ $lt: [{ $strLenCP: '$reviewText' }, 20] }, 2, 0] }, // Very short reviews
                            { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }, // All 1-star reviews
                            { $cond: [{ $eq: ['$rating', 5] }, 0.5, 0] }, // Suspicious 5-star reviews
                            { $cond: [{ $regexMatch: { input: '$reviewText', regex: /(.)\1{4,}/ } }, 3, 0] } // Repeated characters
                        ]
                    }
                }
            },
            {
                $match: {
                    suspicionScore: { $gte: 2 }
                }
            },
            {
                $sort: { suspicionScore: -1, createdAt: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        const total = await Review.countDocuments({
            status: 'Pending'
        });

        res.status(httpStatusCode.OK).json({
            success: true,
            message: "Suspicious reviews retrieved successfully",
            data: {
                reviews: suspiciousReviews
            },
            meta: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: parseInt(limit)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch suspicious reviews: ${error.message}`
        ));
    }
}

// Patient update their own review (with restrictions)
export async function updatePatientReview(req, res, next) {
    const { doctorId, patientId } = req.params;
    const updates = req.body;

    try {
        if (!doctorId || !patientId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID and Patient ID are required.'
            ));
        }

        // Find the review
        const existingReview = await Review.findOne({ doctorId, patientId });
        if (!existingReview) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Review not found.'
            ));
        }

        // Check if review is too old to edit (e.g., 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (existingReview.createdAt < thirtyDaysAgo) {
            return next(new EasyQError(
                'ForbiddenError',
                httpStatusCode.FORBIDDEN,
                true,
                'Reviews older than 30 days cannot be edited.'
            ));
        }

        // Prevent changing certain fields
        const restrictedFields = ['doctorId', 'patientId', 'createdAt', 'reviewId', 'status'];
        restrictedFields.forEach(field => {
            if (updates[field]) {
                delete updates[field];
            }
        });

        // Sanitize text inputs
        if (updates.reviewText) {
            updates.reviewText = sanitizeInput(updates.reviewText);
            if (updates.reviewText.length < 10) {
                return next(new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Review text must be at least 10 characters after sanitization.'
                ));
            }
        }


        // Validate category ratings if provided
        if (updates.categories) {
            const categoryFields = ['communication', 'expertise', 'punctuality', 'facilities'];
            for (const field of categoryFields) {
                if (updates.categories[field] && (updates.categories[field] < 1 || updates.categories[field] > 5)) {
                    return next(new EasyQError(
                        'ValidationError',
                        httpStatusCode.BAD_REQUEST,
                        true,
                        `${field} rating must be between 1 and 5.`
                    ));
                }
            }
        }

        const updatedReview = await Review.findOneAndUpdate(
            { doctorId, patientId },
            { $set: updates },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        ).select('-_id -__v');

        res.status(httpStatusCode.OK).json({
            success: true,
            message: 'Review updated successfully',
            data: {
                review: updatedReview
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error updating review: ${error.message}`
        ));
    }
}
