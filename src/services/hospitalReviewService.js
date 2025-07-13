import HospitalReview from '../model/hospitalReview.js';
import Hospital from '../model/hospital/index.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { CentralValidator } from '../middleware/validation/centralValidator.js';

export class HospitalReviewService {
    
    static async createHospitalReview(reviewData) {
        try {
            const spamDetection = CentralValidator.detectSpam(reviewData.reviewText, {
                minLength: 15,
                spamWords: ['fake', 'spam', 'terrible', 'worst', 'never', 'scam', 'dirty', 'awful']
            });

            if (spamDetection.isSpam) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Review appears to be spam or inappropriate content.'
                );
            }

            const hospitalExists = await Hospital.findOne({ hospitalId: reviewData.hospitalId });
            if (!hospitalExists) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Hospital with ID ${reviewData.hospitalId} not found.`
                );
            }

            const existingReview = await HospitalReview.findOne({ 
                hospitalId: reviewData.hospitalId, 
                patientId: reviewData.patientId 
            });
            
            if (existingReview) {
                throw new EasyQError(
                    'ConflictError',
                    httpStatusCode.CONFLICT,
                    true,
                    'You have already reviewed this hospital. You can update your existing review instead.'
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

            const hospitalReview = await HospitalReview.create(reviewData);
            
            return {
                hospitalReview: hospitalReview,
                reviewId: hospitalReview.reviewId,
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

    static async getHospitalReviews(hospitalId, options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status = 'Approved', 
                sortBy = 'createdAt', 
                sortOrder = 'desc',
                serviceType,
                minRating,
                maxRating,
                dateFrom,
                dateTo
            } = options;

            const filter = { hospitalId, status };
            
            if (serviceType) {
                filter.serviceType = serviceType;
            }
            
            if (minRating || maxRating) {
                filter.overallRating = {};
                if (minRating) filter.overallRating.$gte = parseFloat(minRating);
                if (maxRating) filter.overallRating.$lte = parseFloat(maxRating);
            }

            if (dateFrom || dateTo) {
                filter.visitDate = {};
                if (dateFrom) filter.visitDate.$gte = new Date(dateFrom);
                if (dateTo) filter.visitDate.$lte = new Date(dateTo);
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const skip = (page - 1) * limit;
            const reviews = await HospitalReview.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await HospitalReview.countDocuments(filter);
            
            const hospitalStats = await this.getHospitalRatingStats(hospitalId);

            return {
                reviews: reviews,
                hospitalId: hospitalId,
                statistics: hospitalStats,
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
                    serviceType: serviceType || null,
                    minRating: minRating || null,
                    maxRating: maxRating || null,
                    dateFrom: dateFrom || null,
                    dateTo: dateTo || null,
                    sortBy,
                    sortOrder
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch hospital reviews: ${error.message}`
            );
        }
    }

    static async getHospitalRatingStats(hospitalId) {
        try {
            const ratingStats = await HospitalReview.aggregate([
                { $match: { hospitalId, status: 'Approved' } },
                {
                    $group: {
                        _id: null,
                        averageRating: { $avg: '$overallRating' },
                        totalReviews: { $sum: 1 },
                        avgCleanliness: { $avg: '$categoryRatings.cleanliness' },
                        avgStaffBehavior: { $avg: '$categoryRatings.staffBehavior' },
                        avgWaitingTime: { $avg: '$categoryRatings.waitingTime' },
                        avgFoodQuality: { $avg: '$categoryRatings.foodQuality' },
                        avgAmenities: { $avg: '$categoryRatings.amenities' },
                        avgEmergencyResponse: { $avg: '$categoryRatings.emergencyResponse' },
                        recommendationCount: {
                            $sum: { $cond: ['$wouldRecommend', 1, 0] }
                        },
                        ratingDistribution: {
                            $push: '$overallRating'
                        },
                        serviceTypes: {
                            $push: '$serviceType'
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

            if (!ratingStats.length) {
                return {
                    averageRating: 0,
                    totalReviews: 0,
                    recommendationPercentage: 0,
                    categoryAverages: {
                        cleanliness: 0,
                        staffBehavior: 0,
                        waitingTime: 0,
                        foodQuality: 0,
                        amenities: 0,
                        emergencyResponse: 0
                    },
                    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                    serviceTypeDistribution: {}
                };
            }

            const data = ratingStats[0];
            
            const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            data.ratingDistribution.forEach(rating => {
                const roundedRating = Math.floor(rating);
                ratingDist[roundedRating] = (ratingDist[roundedRating] || 0) + 1;
            });

            const serviceTypeDist = {};
            data.serviceTypes.forEach(type => {
                serviceTypeDist[type] = (serviceTypeDist[type] || 0) + 1;
            });

            return {
                averageRating: Math.round(data.averageRating * 10) / 10,
                totalReviews: data.totalReviews,
                recommendationPercentage: Math.round(data.recommendationPercentage),
                categoryAverages: {
                    cleanliness: Math.round((data.avgCleanliness || 0) * 10) / 10,
                    staffBehavior: Math.round((data.avgStaffBehavior || 0) * 10) / 10,
                    waitingTime: Math.round((data.avgWaitingTime || 0) * 10) / 10,
                    foodQuality: Math.round((data.avgFoodQuality || 0) * 10) / 10,
                    amenities: Math.round((data.avgAmenities || 0) * 10) / 10,
                    emergencyResponse: Math.round((data.avgEmergencyResponse || 0) * 10) / 10
                },
                ratingDistribution: ratingDist,
                serviceTypeDistribution: serviceTypeDist
            };
        } catch (error) {
            throw error;
        }
    }

    static async updateHospitalReview(reviewId, updates) {
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

            const updatedReview = await HospitalReview.findOneAndUpdate(
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
                    'Hospital review not found.'
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

    static async deleteHospitalReview(reviewId) {
        try {
            const deletedReview = await HospitalReview.findOneAndDelete({ reviewId: reviewId }).select('-_id -__v');
            if (!deletedReview) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital review not found.'
                );
            }
            return deletedReview;
        } catch (error) {
            throw error;
        }
    }

    static async getHospitalReviewsByServiceType(serviceType, options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status = 'Approved',
                sortBy = 'overallRating',
                sortOrder = 'desc',
                city,
                minRating
            } = options;

            const filter = { serviceType, status };
            
            if (city) {
                const hospitals = await Hospital.find({ 
                    city: new RegExp(city, 'i') 
                }).select('hospitalId');
                
                const hospitalIds = hospitals.map(h => h.hospitalId);
                filter.hospitalId = { $in: hospitalIds };
            }
            
            if (minRating) {
                filter.overallRating = { $gte: parseFloat(minRating) };
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const skip = (page - 1) * limit;
            const reviews = await HospitalReview.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await HospitalReview.countDocuments(filter);

            const serviceTypeStats = await HospitalReview.aggregate([
                { $match: { serviceType, status: 'Approved' } },
                {
                    $group: {
                        _id: '$hospitalId',
                        hospitalName: { $first: '$hospitalName' },
                        averageRating: { $avg: '$overallRating' },
                        reviewCount: { $sum: 1 }
                    }
                },
                { $sort: { averageRating: -1 } },
                { $limit: 10 }
            ]);

            return {
                reviews: reviews,
                serviceType: serviceType,
                topHospitalsForService: serviceTypeStats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                },
                filters: {
                    city: city || null,
                    minRating: minRating || null,
                    sortBy,
                    sortOrder
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch reviews by service type: ${error.message}`
            );
        }
    }

    static async moderateHospitalReview(reviewId, moderationData) {
        try {
            const { status, moderatorComments, moderatedBy } = moderationData;
            
            const updates = {
                status: status,
                'moderationFlags.moderatedAt': new Date(),
                'moderationFlags.moderatedBy': moderatedBy,
                'moderationFlags.moderatorComments': moderatorComments
            };

            const moderatedReview = await HospitalReview.findOneAndUpdate(
                { reviewId: reviewId },
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-_id -__v');

            if (!moderatedReview) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital review not found.'
                );
            }

            return moderatedReview;
        } catch (error) {
            throw error;
        }
    }

    static async getHospitalComparisonReports(hospitalIds, options = {}) {
        try {
            const { 
                serviceType, 
                dateFrom, 
                dateTo 
            } = options;

            const filter = {
                hospitalId: { $in: hospitalIds },
                status: 'Approved'
            };

            if (serviceType) {
                filter.serviceType = serviceType;
            }

            if (dateFrom || dateTo) {
                filter.visitDate = {};
                if (dateFrom) filter.visitDate.$gte = new Date(dateFrom);
                if (dateTo) filter.visitDate.$lte = new Date(dateTo);
            }

            const comparisonData = await HospitalReview.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$hospitalId',
                        hospitalName: { $first: '$hospitalName' },
                        averageRating: { $avg: '$overallRating' },
                        totalReviews: { $sum: 1 },
                        avgCleanliness: { $avg: '$categoryRatings.cleanliness' },
                        avgStaffBehavior: { $avg: '$categoryRatings.staffBehavior' },
                        avgWaitingTime: { $avg: '$categoryRatings.waitingTime' },
                        avgFoodQuality: { $avg: '$categoryRatings.foodQuality' },
                        avgAmenities: { $avg: '$categoryRatings.amenities' },
                        avgEmergencyResponse: { $avg: '$categoryRatings.emergencyResponse' },
                        recommendationCount: {
                            $sum: { $cond: ['$wouldRecommend', 1, 0] }
                        },
                        serviceTypes: { $addToSet: '$serviceType' }
                    }
                },
                {
                    $addFields: {
                        recommendationPercentage: {
                            $multiply: [
                                { $divide: ['$recommendationCount', '$totalReviews'] },
                                100
                            ]
                        },
                        overallScore: {
                            $avg: [
                                '$avgCleanliness',
                                '$avgStaffBehavior',
                                '$avgWaitingTime',
                                '$avgFoodQuality',
                                '$avgAmenities',
                                '$avgEmergencyResponse'
                            ]
                        }
                    }
                },
                { $sort: { averageRating: -1 } }
            ]);

            const rankings = comparisonData.map((hospital, index) => ({
                ...hospital,
                rank: index + 1,
                categoryAverages: {
                    cleanliness: Math.round((hospital.avgCleanliness || 0) * 10) / 10,
                    staffBehavior: Math.round((hospital.avgStaffBehavior || 0) * 10) / 10,
                    waitingTime: Math.round((hospital.avgWaitingTime || 0) * 10) / 10,
                    foodQuality: Math.round((hospital.avgFoodQuality || 0) * 10) / 10,
                    amenities: Math.round((hospital.avgAmenities || 0) * 10) / 10,
                    emergencyResponse: Math.round((hospital.avgEmergencyResponse || 0) * 10) / 10
                },
                overallScore: Math.round((hospital.overallScore || 0) * 10) / 10,
                averageRating: Math.round((hospital.averageRating || 0) * 10) / 10,
                recommendationPercentage: Math.round(hospital.recommendationPercentage || 0)
            }));

            return {
                hospitalComparison: rankings,
                comparisonCriteria: {
                    hospitalIds,
                    serviceType: serviceType || 'All',
                    dateRange: {
                        from: dateFrom || null,
                        to: dateTo || null
                    }
                },
                summary: {
                    totalHospitalsCompared: rankings.length,
                    averageRatingRange: {
                        highest: rankings[0]?.averageRating || 0,
                        lowest: rankings[rankings.length - 1]?.averageRating || 0
                    }
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to generate comparison report: ${error.message}`
            );
        }
    }

    static async getHospitalReviewTrends(hospitalId, options = {}) {
        try {
            const { 
                period = 'monthly',
                dateFrom,
                dateTo 
            } = options;

            const filter = {
                hospitalId,
                status: 'Approved'
            };

            if (dateFrom || dateTo) {
                filter.visitDate = {};
                if (dateFrom) filter.visitDate.$gte = new Date(dateFrom);
                if (dateTo) filter.visitDate.$lte = new Date(dateTo);
            }

            let groupBy;
            switch (period) {
                case 'daily':
                    groupBy = {
                        year: { $year: '$visitDate' },
                        month: { $month: '$visitDate' },
                        day: { $dayOfMonth: '$visitDate' }
                    };
                    break;
                case 'weekly':
                    groupBy = {
                        year: { $year: '$visitDate' },
                        week: { $week: '$visitDate' }
                    };
                    break;
                case 'yearly':
                    groupBy = {
                        year: { $year: '$visitDate' }
                    };
                    break;
                default: // monthly
                    groupBy = {
                        year: { $year: '$visitDate' },
                        month: { $month: '$visitDate' }
                    };
            }

            const trends = await HospitalReview.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: groupBy,
                        averageRating: { $avg: '$overallRating' },
                        reviewCount: { $sum: 1 },
                        avgCleanliness: { $avg: '$categoryRatings.cleanliness' },
                        avgStaffBehavior: { $avg: '$categoryRatings.staffBehavior' },
                        avgWaitingTime: { $avg: '$categoryRatings.waitingTime' },
                        recommendationRate: {
                            $avg: { $cond: ['$wouldRecommend', 1, 0] }
                        }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
            ]);

            return {
                hospitalId,
                period,
                trends: trends.map(trend => ({
                    period: trend._id,
                    averageRating: Math.round(trend.averageRating * 10) / 10,
                    reviewCount: trend.reviewCount,
                    categoryAverages: {
                        cleanliness: Math.round((trend.avgCleanliness || 0) * 10) / 10,
                        staffBehavior: Math.round((trend.avgStaffBehavior || 0) * 10) / 10,
                        waitingTime: Math.round((trend.avgWaitingTime || 0) * 10) / 10
                    },
                    recommendationRate: Math.round((trend.recommendationRate || 0) * 100)
                })),
                dateRange: {
                    from: dateFrom || null,
                    to: dateTo || null
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch review trends: ${error.message}`
            );
        }
    }
}