import { logInfo, logError } from '../config/logger.js';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    try {
        // Validate input coordinates
        if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
            logError('Invalid coordinates provided for distance calculation', {
                lat1, lng1, lat2, lng2
            });
            return null;
        }

        const R = 6371; // Earth's radius in kilometers
        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        // Round to 2 decimal places
        return Math.round(distance * 100) / 100;
    } catch (error) {
        logError('Error calculating distance', {
            error: error.message,
            lat1, lng1, lat2, lng2
        });
        return null;
    }
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Validate if coordinates are valid
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
function isValidCoordinate(lat, lng) {
    return (
        typeof lat === 'number' && 
        typeof lng === 'number' &&
        !isNaN(lat) && 
        !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
    );
}

/**
 * Get user's default address coordinates
 * @param {Object} user - User object with addresses array
 * @returns {Object|null} { lat, lng } or null if not found
 */
export function getUserDefaultAddressCoords(user) {
    try {
        if (!user || !user.addresses || !Array.isArray(user.addresses) || user.addresses.length === 0) {
            return null;
        }

        // Find default address first, then fallback to first address
        const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
        
        if (!defaultAddress || !defaultAddress.origin) {
            return null;
        }

        const { lat, lng } = defaultAddress.origin;
        
        if (!isValidCoordinate(lat, lng)) {
            return null;
        }

        return { lat, lng };
    } catch (error) {
        logError('Error getting user default address coordinates', {
            error: error.message,
            userId: user?.userId
        });
        return null;
    }
}

/**
 * Get hospital coordinates
 * @param {Object} hospital - Hospital object with location
 * @returns {Object|null} { lat, lng } or null if not found
 */
export function getHospitalCoords(hospital) {
    try {
        if (!hospital || !hospital.location || !hospital.location.coordinates) {
            return null;
        }

        const [lng, lat] = hospital.location.coordinates; // GeoJSON format: [longitude, latitude]
        
        if (!isValidCoordinate(lat, lng)) {
            return null;
        }

        return { lat, lng };
    } catch (error) {
        logError('Error getting hospital coordinates', {
            error: error.message,
            hospitalId: hospital?.hospitalId
        });
        return null;
    }
}

/**
 * Rounds time to the nearest 15-minute interval and returns a range.
 * @param {number} minutes - Time in minutes
 * @returns {string|null} Formatted time range like "10-15 min" or null if invalid
 */
function roundToNearest15Minutes(minutes) {
    if (typeof minutes !== 'number' || minutes < 0) {
        return null;
    }

    // Round to nearest 15-minute interval
    const rounded = Math.ceil(minutes / 15) * 15;
    const lowerBound = Math.max(1, rounded - 15); // Minimum 1 minute
    
    // Handle edge cases
    if (minutes <= 1) return "1-5 min";
    if (minutes <= 5) return "1-5 min";
    if (minutes <= 10) return "5-10 min";
    if (minutes <= 15) return "10-15 min";
    
    return `${lowerBound}-${rounded} min`;
}

/**
 * Calculate approximate travel time using Google Maps ETA.
 * @param {Object} user - User object with an 'addresses' array.
 * @param {Object} hospital - Hospital object with a 'location.coordinates' array [lng, lat].
 * @returns {Promise<string|null>} Approximate time range or null if calculation fails.
 */
export async function calculateApproximateTravelTime(user, hospital) {
    try {
        const userCoords = getUserDefaultAddressCoords(user);
        const hospitalCoords = getHospitalCoords(hospital);

        if (!userCoords || !hospitalCoords) {
            logInfo('Cannot calculate travel time - missing coordinates', {
                userId: user?.userId,
                hospitalId: hospital?.hospitalId,
                hasUserCoords: !!userCoords,
                hasHospitalCoords: !!hospitalCoords
            });
            return null;
        }

        // Import ETA service dynamically to avoid circular dependencies
        const { getEta } = await import('../notificationOrchestrator/services/etaService.js');
        
        const etaResult = await getEta({
            origin: userCoords,
            destination: hospitalCoords,
            mode: 'driving',
            departureTime: 'now'
        });

        // Use duration in traffic if available, otherwise use regular duration
        const durationSeconds = etaResult.durationInTrafficSeconds || etaResult.durationSeconds;
        const durationMinutes = Math.ceil(durationSeconds / 60);

        const approximateTime = roundToNearest15Minutes(durationMinutes);

        logInfo('Travel time calculated successfully', {
            userId: user?.userId,
            hospitalId: hospital?.hospitalId,
            durationMinutes: durationMinutes,
            approximateTime: approximateTime
        });

        return approximateTime;
    } catch (error) {
        logError('Error calculating approximate travel time', {
            error: error.message,
            userId: user?.userId,
            hospitalId: hospital?.hospitalId
        });
        return null;
    }
}

/**
 * Calculate distance between user and hospital
 * @param {Object} user - User object
 * @param {Object} hospital - Hospital object
 * @returns {number|null} Distance in kilometers or null if calculation fails
 */
export function calculateUserHospitalDistance(user, hospital) {
    try {
        const userCoords = getUserDefaultAddressCoords(user);
        const hospitalCoords = getHospitalCoords(hospital);

        if (!userCoords || !hospitalCoords) {
            logInfo('Cannot calculate distance - missing coordinates', {
                userId: user?.userId,
                hospitalId: hospital?.hospitalId,
                hasUserCoords: !!userCoords,
                hasHospitalCoords: !!hospitalCoords
            });
            return null;
        }

        const distance = calculateDistance(
            userCoords.lat,
            userCoords.lng,
            hospitalCoords.lat,
            hospitalCoords.lng
        );

        logInfo('Distance calculated successfully', {
            userId: user?.userId,
            hospitalId: hospital?.hospitalId,
            distance: distance
        });

        return distance;
    } catch (error) {
        logError('Error calculating user-hospital distance', {
            error: error.message,
            userId: user?.userId,
            hospitalId: hospital?.hospitalId
        });
        return null;
    }
}
