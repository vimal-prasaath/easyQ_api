const isValidLat = (lat) => typeof lat === 'number' && lat >= -90 && lat <= 90;
const isValidLng = (lng) => typeof lng === 'number' && lng >= -180 && lng <= 180;

export const validateEtaRequest = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return { value: null, error: new Error('Request body must be an object') };
    }
    const { origin, destination, mode, departureTime, avoid, includePolyline, includeRaw } = payload;

    if (!origin || !isValidLat(origin.lat) || !isValidLng(origin.lng)) {
        return { value: null, error: new Error('origin.lat and origin.lng are required and must be valid numbers') };
    }
    if (!destination || !isValidLat(destination.lat) || !isValidLng(destination.lng)) {
        return { value: null, error: new Error('destination.lat and destination.lng are required and must be valid numbers') };
    }

    const allowedModes = ['driving', 'walking', 'bicycling', 'transit'];
    const finalMode = mode && allowedModes.includes(mode) ? mode : 'driving';

    let finalDepartureTime = 'now';
    if (departureTime && departureTime !== 'now') {
        const t = new Date(departureTime);
        if (isNaN(t.getTime())) {
            return { value: null, error: new Error('departureTime must be "now" or a valid ISO datetime') };
        }
        finalDepartureTime = t.toISOString();
    }

    let finalAvoid;
    if (Array.isArray(avoid) && avoid.length > 0) {
        const allowed = new Set(['tolls', 'highways', 'ferries']);
        finalAvoid = avoid.filter((a) => allowed.has(a));
    }

    return {
        value: {
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            mode: finalMode,
            departureTime: finalDepartureTime,
            avoid: finalAvoid,
            includePolyline: Boolean(includePolyline),
            includeRaw: Boolean(includeRaw)
        },
        error: null
    };
};


