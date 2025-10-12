import { getDirections } from './mapsClient.js';

export const getEta = async ({ origin, destination, mode, departureTime, avoid, includePolyline, includeRaw }) => {
    const data = await getDirections({ origin, destination, mode, departureTime, avoid });
    const route = data.routes && data.routes[0];
    const leg = route && route.legs && route.legs[0];
    if (!leg) {
        throw new Error('No route found between origin and destination');
    }

    const distanceMeters = leg.distance?.value ?? null;
    const durationSeconds = leg.duration?.value ?? null;
    const durationInTrafficSeconds = leg.duration_in_traffic?.value ?? null;
    const text = {
        distance: leg.distance?.text ?? '',
        duration: leg.duration?.text ?? ''
    };

    const result = {
        distanceMeters,
        durationSeconds,
        durationInTrafficSeconds,
        text,
        polyline: includePolyline ? (route.overview_polyline?.points ?? null) : null,
        originName: leg.start_address || null,
        destinationName: leg.end_address || null
    };

    if (includeRaw) {
        result.raw = { status: data.status, geocoded_waypoints: data.geocoded_waypoints?.length ?? 0 };
    }

    return result;
};


