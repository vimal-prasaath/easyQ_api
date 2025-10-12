import { validateAutocompleteRequest } from '../validation/placesSchemas.js';
import { placesAutocomplete, placeDetails } from '../services/mapsClient.js';
import { EasyQError } from '../../config/error.js';
import { httpStatusCode } from '../../util/statusCode.js';
import { logError } from '../../config/logger.js';

/**
 * Parse Google Places address components into structured format
 */
function parseAddressComponents(addressComponents) {
    if (!Array.isArray(addressComponents)) {
        return {
            city: null,
            state: null,
            pincode: null,
            country: null,
            street: null,
            area: null
        };
    }

    const components = {
        city: null,
        state: null,
        pincode: null,
        country: null,
        street: null,
        area: null
    };

    addressComponents.forEach(component => {
        const types = component.types;
        const longName = component.long_name;
        const shortName = component.short_name;

        if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            components.city = longName;
        } else if (types.includes('administrative_area_level_1')) {
            components.state = longName;
        } else if (types.includes('postal_code')) {
            components.pincode = longName;
        } else if (types.includes('country')) {
            components.country = longName;
        } else if (types.includes('route') || types.includes('street_address')) {
            components.street = longName;
        } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
            components.area = longName;
        }
    });

    return components;
}

export const autocompleteController = async (req, res, next) => {
    try {
        const { value, error } = validateAutocompleteRequest(req.body || {});
        if (error) throw new EasyQError('ValidationError', httpStatusCode.BAD_REQUEST, true, error.message);

        console.log('🔍 Autocomplete request:', { input: value.input, sessionToken: value.sessionToken });
        
        const ac = await placesAutocomplete(value);
        console.log('📍 Google Maps response:', { status: ac?.status, predictionsCount: ac?.predictions?.length });
        
        if (!ac || !Array.isArray(ac.predictions)) {
            throw new EasyQError('NotFoundError', httpStatusCode.NOT_FOUND, true, 'No predictions found');
        }

        // Resolve the first n predictions to lat/lng via place details
        const results = [];
        for (const p of ac.predictions.slice(0, 5)) {
            const details = await placeDetails({ placeId: p.place_id, sessionToken: value.sessionToken });
            const loc = details?.result?.geometry?.location;
            
            if (loc) {
                // Parse address components
                const addressComponents = parseAddressComponents(details?.result?.address_components);
                
                results.push({
                    // Format aligned with User Address Schema
                    placeId: p.place_id,
                    addressName: details?.result?.name || p.structured_formatting?.main_text || 'Address',
                    origin: {
                        lat: loc.lat,
                        lng: loc.lng
                    },
                    fullAddress: details?.result?.formatted_address || p.description,
                    
                    // Structured address components
                    addressComponents: {
                        city: addressComponents.city,
                        state: addressComponents.state,
                        pincode: addressComponents.pincode,
                        country: addressComponents.country,
                        street: addressComponents.street,
                        area: addressComponents.area
                    },
                    
                    // Additional metadata for frontend
                    description: p.description,
                    types: details?.result?.types || []
                });
            }
        }

        return res.status(httpStatusCode.OK).json({ status: 'success', data: { predictions: results } });
    } catch (err) {
        logError(err, { endpoint: '/api/orchestrator/places/autocomplete' });
        if (err instanceof EasyQError) return next(err);
        return next(new EasyQError('InternalServerError', httpStatusCode.INTERNAL_SERVER_ERROR, true, 'Failed to fetch autocomplete'));
    }
};


