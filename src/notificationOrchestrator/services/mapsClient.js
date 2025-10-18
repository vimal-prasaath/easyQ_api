import { Client } from '@googlemaps/google-maps-services-js';

const apiKey = process.env.GMAP_KEY;
const client = new Client({});

export const getDirections = async ({ origin, destination, mode, departureTime, avoid }) => {
    const params = {
        key: apiKey,
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode,
    };
    if (departureTime) params.departure_time = departureTime === 'now' ? 'now' : new Date(departureTime);
    if (Array.isArray(avoid) && avoid.length > 0) params.avoid = avoid.join('|');

    const res = await client.directions({ params });
    return res.data;
};

export const placesAutocomplete = async ({ input, sessionToken, locationBias, radiusMeters, country }) => {
    const params = {
        key: apiKey,
        input
    };
    if (sessionToken) params.sessiontoken = sessionToken;
    if (locationBias && typeof locationBias.lat === 'number' && typeof locationBias.lng === 'number') {
        params.location = `${locationBias.lat},${locationBias.lng}`;
        if (radiusMeters) params.radius = radiusMeters;
    }
    if (country) params.components = `country:${country}`;

    console.log('🗺️ Google Maps API request:', { 
        input: params.input, 
        hasKey: !!params.key, 
        keyLength: params.key?.length,
        sessionToken: !!params.sessiontoken 
    });

    try {
        const res = await client.placeAutocomplete({ params });
        console.log('✅ Google Maps API success:', { status: res.data.status });
        return res.data;
    } catch (error) {
        console.error('❌ Google Maps API error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
};

export const placeDetails = async ({ placeId, sessionToken }) => {
    const params = {
        key: apiKey,
        place_id: placeId,
        fields: [
            'geometry/location',
            'name',
            'formatted_address',
            'address_components'
        ].join(',')
    };
    if (sessionToken) params.sessiontoken = sessionToken;
    const res = await client.placeDetails({ params });
    return res.data;
};

export const placeDetailsWithReviews = async ({ placeId, sessionToken }) => {
    const params = {
        key: apiKey,
        place_id: placeId,
        fields: [
            'name',
            'formatted_address',
            'rating',
            'user_ratings_total',
            'reviews'
        ].join(',')
    };
    if (sessionToken) params.sessiontoken = sessionToken;
    const res = await client.placeDetails({ params });
    return res.data;
};

export const placesTextSearch = async ({ query, location, radius }) => {
    const params = {
        key: apiKey,
        query
    };
    if (location) {
        params.location = `${location.lat},${location.lng}`;
        if (radius) params.radius = radius;
    }
    
    console.log('🔍 Google Places Text Search request:', { 
        query: params.query, 
        hasLocation: !!params.location,
        hasKey: !!params.key
    });
    
    try {
        const res = await client.textSearch({ params });
        console.log('✅ Google Places Text Search success:', { status: res.data.status });
        return res.data;
    } catch (error) {
        console.error('❌ Google Places Text Search error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
};


