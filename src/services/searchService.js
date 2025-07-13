import Hospital from '../model/hospital/index.js';
import SearchSuggestion from '../model/search.js';
import { buildSearchPipeline, constructLastquery, lastqueryUpdate } from '../util/searchUtil.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

export class SearchService {
    
    static async searchHospitals(searchParams, userId) {
        try {
            const lastquery = constructLastquery(searchParams);
            
            await this.updateSearchHistory(userId, lastquery);
            
            const pipeline = buildSearchPipeline(searchParams);
            const hospitals = await Hospital.aggregate(pipeline);
            
            if (!hospitals || hospitals.length === 0) {
                return {
                    hospitals: [],
                    message: 'No hospitals found matching your search criteria',
                    searchParams: searchParams
                };
            }
            
            return {
                hospitals: hospitals,
                message: 'Hospitals found successfully',
                searchParams: searchParams,
                totalResults: hospitals.length
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to search hospitals: ${error.message}`
            );
        }
    }

    static async updateSearchHistory(userId, lastquery) {
        try {
            const existing = await SearchSuggestion.findOne({ userId: userId });

            if (existing && existing?.lastquery?.length !== 0) {
                await SearchSuggestion.findOneAndUpdate(
                    { userId: userId },
                    { $set: { lastquery: lastquery } },
                    { upsert: true, new: true, runValidators: true }
                );
            } else {
                await SearchSuggestion.findOneAndUpdate(
                    { userId: userId },
                    { $set: { lastquery: [lastquery] } },
                    { upsert: true, new: true, runValidators: true }
                );
            }
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to update search history: ${error.message}`
            );
        }
    }

    static async getSearchSuggestions(userId, options = {}) {
        try {
            const { limit = 10 } = options;
            
            const suggestions = await SearchSuggestion.findOne({ userId: userId })
                .select('-_id -__v')
                .limit(limit);

            if (!suggestions) {
                return {
                    suggestions: [],
                    message: 'No search suggestions found for this user'
                };
            }

            return {
                suggestions: suggestions.lastquery || [],
                message: 'Search suggestions retrieved successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve search suggestions: ${error.message}`
            );
        }
    }

    static async clearSearchHistory(userId) {
        try {
            const result = await SearchSuggestion.deleteOne({ userId: userId });

            if (result.deletedCount === 0) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'No search history found for this user'
                );
            }

            return { message: 'Search history cleared successfully' };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to clear search history: ${error.message}`
            );
        }
    }

    static async getPopularSearches(options = {}) {
        try {
            const { limit = 10 } = options;
            
            const popularSearches = await SearchSuggestion.aggregate([
                { $unwind: '$lastquery' },
                { $group: { _id: '$lastquery', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: limit },
                { $project: { _id: 0, searchTerm: '$_id', count: 1 } }
            ]);

            return {
                popularSearches,
                message: 'Popular searches retrieved successfully'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve popular searches: ${error.message}`
            );
        }
    }

    static async searchByFilters(filters, options = {}) {
        try {
            const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = options;
            const skip = (page - 1) * limit;

            const query = {};
            
            if (filters.name) {
                query.name = { $regex: filters.name, $options: 'i' };
            }
            
            if (filters.city) {
                query['address.city'] = { $regex: filters.city, $options: 'i' };
            }
            
            if (filters.state) {
                query['address.state'] = { $regex: filters.state, $options: 'i' };
            }
            
            if (filters.specialization) {
                query.specializations = { $in: [filters.specialization] };
            }
            
            if (filters.rating) {
                query.rating = { $gte: filters.rating };
            }

            const hospitals = await Hospital.find(query)
                .select('-_id -__v')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(limit);

            const totalCount = await Hospital.countDocuments(query);

            return {
                hospitals,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: page < Math.ceil(totalCount / limit),
                    hasPrev: page > 1
                },
                filters: filters
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to search hospitals by filters: ${error.message}`
            );
        }
    }

    static async getHospitalById(hospitalId) {
        try {
            const hospital = await Hospital.findOne({ hospitalId: hospitalId })
                .select('-_id -__v');

            if (!hospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital not found'
                );
            }

            return hospital;
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve hospital: ${error.message}`
            );
        }
    }
}