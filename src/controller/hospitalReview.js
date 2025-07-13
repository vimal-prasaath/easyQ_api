
import HospitalReview from "../model/hospitalReview.js";
import Hospital from "../model/hospital/index.js";
import { EasyQError } from '../config/error.js'; 
import { httpStatusCode } from '../util/statusCode.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { ValidationErrorHandler } from '../util/errorHandler.js';

export async function createHospitalReview(req, res, next) {
    const data = req.body;
    
    try {
        const inputErrors = ValidationErrorHandler.validateHospitalReviewInput(data);
        if (inputErrors.length > 0) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ValidationErrorHandler.createErrorResponse(inputErrors, 'InputValidationError')
            );
        }

        const hospitalExists = await Hospital.findOne({ hospitalId: data.hospitalId });
        if (!hospitalExists) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Hospital with ID ${data.hospitalId} not found.`
            ));
        }

        const existingReview = await HospitalReview.findOne({ 
            hospitalId: data.hospitalId, 
            patientId: data.patientId 
        });
        
        if (existingReview) {
            return next(new EasyQError(
                'ConflictError',
                httpStatusCode.CONFLICT,
                true,
                'You have already reviewed this hospital. You can update your existing review instead.'
            ));
        }

        const hospitalReview = await HospitalReview.create(data);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Hospital review created successfully",
            data: {
                hospitalReview: hospitalReview,
                reviewId: hospitalReview.reviewId
            },
            statusCode: httpStatusCode.CREATED
        });
        
        res.status(httpStatusCode.CREATED).json(response);
        
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'createHospitalReview', next);
    }
}

export async function getHospitalReviews(req, res, next) {
    const { hospitalId } = req.params;
    const { page = 1, limit = 10, status = 'Approved', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    try {
        if (!hospitalId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required.'
            ));
        }

        const filter = { hospitalId, status };
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const skip = (page - 1) * limit;
        const reviews = await HospitalReview.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .select(ResponseFormatter.getSelectFields());

        const total = await HospitalReview.countDocuments(filter);
        
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
                    }
                }
            },
            {
                $addFields: {
                    recommendationPercentage: {
                        $cond: [
                            { $eq: ['$totalReviews', 0] },
                            0,
                            { $multiply: [{ $divide: ['$recommendationCount', '$totalReviews'] }, 100] }
                        ]
                    }
                }
            }
        ]);

        const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 };

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Hospital reviews retrieved successfully",
            data: {
                reviews,
                hospitalId,
                statistics: {
                    averageRating: Math.round(stats.averageRating * 10) / 10,
                    totalReviews: stats.totalReviews,
                    recommendationPercentage: Math.round(stats.recommendationPercentage || 0),
                    categoryAverages: {
                        cleanliness: Math.round((stats.avgCleanliness || 0) * 10) / 10,
                        staffBehavior: Math.round((stats.avgStaffBehavior || 0) * 10) / 10,
                        waitingTime: Math.round((stats.avgWaitingTime || 0) * 10) / 10,
                        foodQuality: Math.round((stats.avgFoodQuality || 0) * 10) / 10,
                        amenities: Math.round((stats.avgAmenities || 0) * 10) / 10,
                        emergencyResponse: Math.round((stats.avgEmergencyResponse || 0) * 10) / 10
                    }
                }
            },
            meta: ResponseFormatter.formatPaginationMeta(page, limit, total)
        });

        res.status(httpStatusCode.OK).json(response);
        
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'getHospitalReviews', next);
    }
}

export async function getHospitalRatingSummary(req, res, next) {
    const { hospitalId } = req.params;

    try {
        if (!hospitalId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required.'
            ));
        }

        const summary = await HospitalReview.aggregate([
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
                    recommendationCount: { $sum: { $cond: ['$wouldRecommend', 1, 0] } },
                    ratingDistribution: { $push: '$overallRating' },
                    visitTypeDistribution: { $push: '$visitType' }
                }
            },
            {
                $addFields: {
                    recommendationPercentage: {
                        $cond: [
                            { $eq: ['$totalReviews', 0] },
                            0,
                            { $multiply: [{ $divide: ['$recommendationCount', '$totalReviews'] }, 100] }
                        ]
                    }
                }
            }
        ]);

        if (!summary.length) {
            const response = ResponseFormatter.formatSuccessResponse({
                message: "No reviews found for this hospital",
                data: {
                    hospitalId,
                    summary: {
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
                        visitTypeDistribution: {}
                    }
                }
            });
            return res.status(httpStatusCode.OK).json(response);
        }

        const data = summary[0];
        
        const ratingDist = { 5: 0, 4.5: 0, 4: 0, 3.5: 0, 3: 0, 2.5: 0, 2: 0, 1.5: 0, 1: 0 };
        data.ratingDistribution.forEach(rating => {
            ratingDist[rating] = (ratingDist[rating] || 0) + 1;
        });

        const visitTypeDist = {};
        data.visitTypeDistribution.forEach(type => {
            visitTypeDist[type] = (visitTypeDist[type] || 0) + 1;
        });

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Hospital rating summary retrieved successfully",
            data: {
                hospitalId,
                summary: {
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
                    visitTypeDistribution: visitTypeDist
                }
            }
        });

        res.status(httpStatusCode.OK).json(response);
        
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'getHospitalRatingSummary', next);
    }
}

export async function updateHospitalReview(req, res, next) {
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

        const restrictedFields = ['reviewId', 'hospitalId', 'patientId', 'createdAt'];
        restrictedFields.forEach(field => {
            if (updates[field]) delete updates[field];
        });

        const updatedReview = await HospitalReview.findOneAndUpdate(
            { reviewId },
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
                'Hospital review not found.'
            ));
        }

        const response = ResponseFormatter.formatSuccessResponse({
            message: 'Hospital review updated successfully',
            data: { hospitalReview: updatedReview }
        });

        res.status(httpStatusCode.OK).json(response);

    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'updateHospitalReview', next);
    }
}

export async function deleteHospitalReview(req, res, next) {
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

        const deletedReview = await HospitalReview.findOneAndDelete({ reviewId })
            .select(ResponseFormatter.getSelectFields());
            
        if (!deletedReview) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Hospital review not found.'
            ));
        }

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Hospital review deleted successfully",
            data: { deletedReview }
        });

        res.status(httpStatusCode.OK).json(response);
        
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'deleteHospitalReview', next);
    }
}