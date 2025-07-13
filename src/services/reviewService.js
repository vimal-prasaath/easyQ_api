import Review from '../model/review.js';
import Doctor from '../model/doctor.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { CentralValidator } from '../middleware/validation/centralValidator.js';

export class ReviewService {
    
    static async createReview(reviewData) {
        try {
            const spamDetection = CentralValidator.detectSpam(reviewData.reviewText, {
                minLength: 15,
                spamWords: ['fake', 'spam', 'terrible', 'worst', 'never', 'scam']
            });

            if (spamDetection.isSpam) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Review appears to be spam or inappropriate content.'
                );
            }

            const doctorExists = await Doctor.findOne({ doctorId: reviewData.doctorId });
            if (!doctorExists) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Doctor with ID ${reviewData.doctorId} not found.`
                );
            }

            const existingReview = await Review.findOne({ 
                doctorId: reviewData.doctorId, 
                patientId: reviewData.patientId 
            });
            
            if (existingReview) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    'You have already reviewed this doctor. You can update your existing review instead.'
                );
            }

            reviewData.reviewText = CentralValidator.sanitizeText(reviewData.reviewText);

            if (spamDetection.spamScore > 0) {
                reviewData.moderationFlags = {
                    suspicionScore: spamDetection.spamScore,
                    needsReview: true
                };
                reviewData.status = 'Under_Review';
            }

            const review = await Review.create(reviewData);
            
            return {
                review: review,
                reviewId: review.reviewId,
                moderationInfo: spamDetection.spamScore > 0 ? {
                    status: 'Under review due to content flagging',
                    suspicionScore: spamDetection.spamScore
                } : null
            };
        } catch (error) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            throw error;
        }
    }

    static async getReviewsByDoctor(doctorId, options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status = 'Approved', 
                sortBy = 'createdAt', 
                sortOrder = 'desc',
                minRating,
                maxRating
            } = options;

            const filter = { doctorId, status };
            
            if (minRating || maxRating) {
                filter.overallRating = {};
                if (minRating) filter.overallRating.$gte = parseFloat(minRating);
                if (maxRating) filter.overallRating.$lte = parseFloat(maxRating);
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const skip = (page - 1) * limit;
            const reviews = await Review.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await Review.countDocuments(filter);
            
            const ratingStats = await Review.aggregate([
                { $match: { doctorId, status: 'Approved' } },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: '$overallRating' },
                        totalReviews: { $sum: 1 },
                        avgCommunication: { $avg: '$categoryRatings.communication' },
                        avgExpertise: { $avg: '$categoryRatings.expertise' },
                        avgPunctuality: { $avg: '$categoryRatings.punctuality' },
                        avgBedSideManner: { $avg: '$categoryRatings.bedSideManner' }
                    }
                }
            ]);

            const stats = ratingStats[0] || { 
                averageRating: 0, 
                totalReviews: 0,
                avgCommunication: 0,
                avgExpertise: 0,
                avgPunctuality: 0,
                avgBedSideManner: 0
            };

            return {
                reviews: reviews,
                doctorId: doctorId,
                statistics: {
                    averageRating: Math.round(stats.averageRating * 10) / 10,
                    totalReviews: stats.totalReviews,
                    categoryAverages: {
                        communication: Math.round((stats.avgCommunication || 0) * 10) / 10,
                        expertise: Math.round((stats.avgExpertise || 0) * 10) / 10,
                        punctuality: Math.round((stats.avgPunctuality || 0) * 10) / 10,
                        bedSideManner: Math.round((stats.avgBedSideManner || 0) * 10) / 10
                    }
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                },
                filters: {
                    status,
                    minRating: minRating || null,
                    maxRating: maxRating || null,
                    sortBy,
                    sortOrder
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch reviews: ${error.message}`
            );
        }
    }

    static async updateReview(reviewId, updates) {
        try {
            if (Object.keys(updates).length === 0) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'No update fields provided.'
                );
            }

            if (updates.reviewText) {
                const spamDetection = CentralValidator.detectSpam(updates.reviewText);
                if (spamDetection.isSpam) {
                    throw new EasyQError(
                        'ValidationError',
                        httpStatusCode.BAD_REQUEST,
                        true,
                        'Updated review appears to be spam or inappropriate content.'
                    );
                }
                updates.reviewText = CentralValidator.sanitizeText(updates.reviewText);
                
                if (spamDetection.spamScore > 0) {
                    updates.status = 'Under_Review';
                    updates['moderationFlags.suspicionScore'] = spamDetection.spamScore;
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
            ).select('-_id -__v');

            if (!updatedReview) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Review not found.'
                );
            }

            return updatedReview;
        } catch (error) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            throw error;
        }
    }

    static async deleteReview(reviewId) {
        try {
            const deletedReview = await Review.findOneAndDelete({ reviewId: reviewId }).select('-_id -__v');
            if (!deletedReview) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Review not found.'
                );
            }
            return deletedReview;
        } catch (error) {
            throw error;
        }
    }

    static async getDoctorRatingSummary(doctorId) {
        try {
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
                        },
                        treatmentTypes: {
                            $push: '$treatmentType'
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
                return {
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
                        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                        treatmentTypeDistribution: {}
                    }
                };
            }

            const data = summary[0];
            
            const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            data.ratingDistribution.forEach(rating => {
                const roundedRating = Math.floor(rating);
                ratingDist[roundedRating] = (ratingDist[roundedRating] || 0) + 1;
            });

            const treatmentTypeDist = {};
            data.treatmentTypes.forEach(type => {
                treatmentTypeDist[type] = (treatmentTypeDist[type] || 0) + 1;
            });

            return {
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
                    ratingDistribution: ratingDist,
                    treatmentTypeDistribution: treatmentTypeDist
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch rating summary: ${error.message}`
            );
        }
    }

    static async moderateReview(reviewId, moderationData) {
        try {
            const { status, moderatorComments, moderatedBy } = moderationData;
            
            const updates = {
                status: status,
                'moderationFlags.moderatedAt': new Date(),
                'moderationFlags.moderatedBy': moderatedBy,
                'moderationFlags.moderatorComments': moderatorComments
            };

            const moderatedReview = await Review.findOneAndUpdate(
                { reviewId: reviewId },
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-_id -__v');

            if (!moderatedReview) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Review not found.'
                );
            }

            return moderatedReview;
        } catch (error) {
            throw error;
        }
    }

    static async getSuspiciousReviews(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                minSuspicionScore = 3,
                sortBy = 'moderationFlags.suspicionScore',
                sortOrder = 'desc'
            } = options;

            const filter = {
                'moderationFlags.suspicionScore': { $gte: minSuspicionScore },
                status: { $in: ['Pending', 'Under_Review'] }
            };

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const skip = (page - 1) * limit;
            const reviews = await Review.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await Review.countDocuments(filter);

            return {
                suspiciousReviews: reviews,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                },
                filters: {
                    minSuspicionScore,
                    sortBy,
                    sortOrder
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch suspicious reviews: ${error.message}`
            );
        }
    }

    static async bulkModerateReviews(reviewIds, moderationData) {
        try {
            const { status, moderatedBy, moderatorComments } = moderationData;
            
            const updates = {
                status: status,
                'moderationFlags.moderatedAt': new Date(),
                'moderationFlags.moderatedBy': moderatedBy,
                'moderationFlags.moderatorComments': moderatorComments
            };

            const result = await Review.updateMany(
                { reviewId: { $in: reviewIds } },
                { $set: updates },
                { runValidators: true }
            );

            return {
                modifiedCount: result.modifiedCount,
                matchedCount: result.matchedCount,
                reviewIds: reviewIds,
                moderationData: moderationData
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Bulk moderation failed: ${error.message}`
            );
        }
    }

    static async getReviewsByPatient(patientId, options = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

            const filter = { patientId };
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const skip = (page - 1) * limit;
            const reviews = await Review.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await Review.countDocuments(filter);

            return {
                reviews: reviews,
                patientId: patientId,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch patient reviews: ${error.message}`
            );
        }
    }
}