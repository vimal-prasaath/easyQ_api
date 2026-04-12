import { HospitalAutocompleteService } from '../services/hospitalAutocompleteService.js';
import HospitalSuggestion from '../model/hospitalSuggestion.js';
import { UserService } from '../services/userService.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logApiRequest, logApiResponse, logError } from '../config/logger.js';
import { constructResponse } from '../util/responseFormatter.js';

/**
 * Hospital Autocomplete API
 * POST /api/hospital/autocomplete
 * Open API - No authentication required
 */
export async function hospitalAutocomplete(req, res, next) {
    logApiRequest(req, { action: 'hospital_autocomplete', body: req.body });

    try {
        const { input, sessionToken, locationBias, radiusMeters, country } = req.body;

        if (!input || typeof input !== 'string' || input.trim().length < 2) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Input is required and must be at least 2 characters long'
            ));
        }

        const hospitals = await HospitalAutocompleteService.searchHospitals({
            input,
            sessionToken,
            locationBias,
            radiusMeters,
            country
        });

        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Hospital autocomplete results retrieved successfully',
            {
                hospitals,
                totalResults: hospitals.length
            }
        );

        logApiResponse(req, response);
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError(error, { endpoint: '/api/hospital/autocomplete' });
        next(error);
    }
}

/**
 * Save Hospital Suggestion from User
 * POST /api/hospital/suggest
 * Open API - No authentication required
 */
export async function saveHospitalSuggestion(req, res, next) {
    logApiRequest(req, { action: 'save_hospital_suggestion', body: req.body });

    try {
        const { userId, hospitalName, location, placeId, fullAddress, coordinates } = req.body;

        // Validation
        if (!userId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID is required'
            ));
        }

        if (!hospitalName || typeof hospitalName !== 'string' || hospitalName.trim().length === 0) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital name is required'
            ));
        }

        if (!location || !location.city || !location.state) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Location with city and state is required'
            ));
        }

        // Create suggestion
        const suggestion = new HospitalSuggestion({
            userId,
            hospitalName: hospitalName.trim(),
            location: {
                street: location.street || '',
                city: location.city.trim(),
                state: location.state.trim(),
                pincode: location.pincode || '',
                country: location.country || ''
            },
            placeId: placeId || '',
            fullAddress: fullAddress || '',
            coordinates: coordinates || {}
        });

        const savedSuggestion = await suggestion.save();

        const response = constructResponse(
            true,
            httpStatusCode.CREATED,
            'Hospital suggestion saved successfully',
            {
                suggestionId: savedSuggestion._id,
                hospitalName: savedSuggestion.hospitalName,
                location: savedSuggestion.location,
                suggestedAt: savedSuggestion.suggestedAt
            }
        );

        logApiResponse(req, response);
        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        logError(error, { endpoint: '/api/hospital/suggest' });
        
        if (error.name === 'ValidationError') {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                error.message
            ));
        }

        next(error);
    }
}

/**
 * List All Hospital Suggestions with User Details
 * GET /api/hospital/suggestions
 * Open API - No authentication required
 */
export async function listHospitalSuggestions(req, res, next) {
    logApiRequest(req, { action: 'list_hospital_suggestions', query: req.query });

    try {
        const { 
            page = 1, 
            limit = 20, 
            search,
            city,
            state,
            sortBy = 'suggestedAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { hospitalName: { $regex: search, $options: 'i' } },
                { fullAddress: { $regex: search, $options: 'i' } }
            ];
        }

        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }

        if (state) {
            query['location.state'] = { $regex: state, $options: 'i' };
        }

        // Get suggestions with pagination
        const suggestions = await HospitalSuggestion.find(query)
            .select('-__v')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const totalCount = await HospitalSuggestion.countDocuments(query);

        // Fetch user details for each suggestion
        const suggestionsWithUserDetails = await Promise.all(
            suggestions.map(async (suggestion) => {
                let userDetails = null;
                
                try {
                    const user = await UserService.getUserById(suggestion.userId);
                    userDetails = {
                        userId: user.userId,
                        name: user.name || 'N/A',
                        phoneNumber: user.phoneNumber || 'N/A',
                        email: user.email || 'N/A',
                        role: user.role || 'N/A'
                    };
                } catch (error) {
                    // If user not found, still return suggestion with null user details
                    userDetails = {
                        userId: suggestion.userId,
                        name: 'User not found',
                        phoneNumber: 'N/A',
                        email: 'N/A',
                        role: 'N/A'
                    };
                }

                return {
                    suggestionId: suggestion._id ? suggestion._id.toString() : null,
                    hospitalName: suggestion.hospitalName,
                    location: suggestion.location,
                    fullAddress: suggestion.fullAddress,
                    placeId: suggestion.placeId,
                    coordinates: suggestion.coordinates,
                    suggestedAt: suggestion.suggestedAt,
                    createdAt: suggestion.createdAt,
                    updatedAt: suggestion.updatedAt,
                    suggestedBy: userDetails
                };
            })
        );

        const response = constructResponse(
            true,
            httpStatusCode.OK,
            'Hospital suggestions retrieved successfully',
            {
                suggestions: suggestionsWithUserDetails,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCount / limitNum),
                    totalCount,
                    limit: limitNum,
                    hasNext: pageNum < Math.ceil(totalCount / limitNum),
                    hasPrev: pageNum > 1
                }
            }
        );

        logApiResponse(req, response);
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        logError(error, { endpoint: '/api/hospital/suggestions' });
        next(error);
    }
}


