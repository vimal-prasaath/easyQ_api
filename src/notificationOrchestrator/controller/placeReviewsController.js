import { validatePlaceReviewsRequest } from '../validation/placeReviewsSchemas.js';
import { placesTextSearch, placeDetailsWithReviews } from '../services/mapsClient.js';
import { EasyQError } from '../../config/error.js';
import { httpStatusCode } from '../../util/statusCode.js';
import { logError } from '../../config/logger.js';

export const placeReviewsController = async (req, res, next) => {
    try {
        const { value, error } = validatePlaceReviewsRequest(req.body || {});
        if (error) throw new EasyQError('ValidationError', httpStatusCode.BAD_REQUEST, true, error.message);

        console.log('🔍 Place reviews request:', { 
            description: value.description, 
            coordinates: value.origin 
        });

        // Step 1: Search for the place using description
        const searchResult = await placesTextSearch({
            query: value.description,
            location: value.origin,
            radius: 100 // 100 meters radius
        });

        if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
            throw new EasyQError('NotFoundError', httpStatusCode.NOT_FOUND, true, 'No places found for the given address');
        }

        // Get the first (most relevant) result
        const place = searchResult.results[0];
        const placeId = place.place_id;

        console.log('📍 Found place:', { 
            placeId, 
            name: place.name,
            rating: place.rating 
        });

        // Step 2: Get detailed place information including reviews
        const placeDetails = await placeDetailsWithReviews({ placeId });

        if (!placeDetails || !placeDetails.result) {
            throw new EasyQError('NotFoundError', httpStatusCode.NOT_FOUND, true, 'Place details not found');
        }

        const result = placeDetails.result;

        // Format the response
        const response = {
            placeId: result.place_id,
            name: result.name,
            formattedAddress: result.formatted_address,
            rating: result.rating || null,
            userRatingsTotal: result.user_ratings_total || 0
        };

        console.log('✅ Place reviews retrieved:', { 
            placeId, 
            rating: response.rating,
            totalRatings: response.userRatingsTotal 
        });

        return res.status(httpStatusCode.OK).json({ 
            status: 'success', 
            data: response 
        });

    } catch (err) {
        logError(err, { endpoint: '/api/orchestrator/place-reviews' });
        if (err instanceof EasyQError) return next(err);
        return next(new EasyQError('InternalServerError', httpStatusCode.INTERNAL_SERVER_ERROR, true, 'Failed to fetch place reviews'));
    }
};
