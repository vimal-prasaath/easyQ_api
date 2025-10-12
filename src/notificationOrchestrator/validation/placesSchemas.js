const isValidLat = (lat) => typeof lat === 'number' && lat >= -90 && lat <= 90;
const isValidLng = (lng) => typeof lng === 'number' && lng >= -180 && lng <= 180;

export const validateAutocompleteRequest = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return { value: null, error: new Error('Request body must be an object') };
    }
    const { input, sessionToken, locationBias, radiusMeters, country } = payload;

    if (typeof input !== 'string' || input.trim().length < 3) {
        return { value: null, error: new Error('input must be a string with at least 3 characters') };
    }

    let bias;
    if (locationBias) {
        if (!isValidLat(locationBias.lat) || !isValidLng(locationBias.lng)) {
            return { value: null, error: new Error('locationBias.lat and locationBias.lng must be valid numbers') };
        }
        bias = { lat: locationBias.lat, lng: locationBias.lng };
    }

    let radius = undefined;
    if (radiusMeters !== undefined) {
        const r = Number(radiusMeters);
        if (!Number.isFinite(r) || r <= 0) {
            return { value: null, error: new Error('radiusMeters must be a positive number') };
        }
        radius = r;
    }

    let countryComponent;
    if (country) {
        if (typeof country !== 'string' || country.length !== 2) {
            return { value: null, error: new Error('country must be a 2-letter ISO code') };
        }
        countryComponent = country.toUpperCase();
    }

    return {
        value: {
            input: input.trim(),
            sessionToken: typeof sessionToken === 'string' && sessionToken.trim().length > 0 ? sessionToken.trim() : undefined,
            locationBias: bias,
            radiusMeters: radius,
            country: countryComponent
        },
        error: null
    };
};


