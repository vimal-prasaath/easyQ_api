import { placesAutocomplete, placeDetails } from '../notificationOrchestrator/services/mapsClient.js';
import Hospital from '../model/hospital.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

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
            street: null
        };
    }

    const components = {
        city: null,
        state: null,
        pincode: null,
        country: null,
        street: null
    };

    addressComponents.forEach(component => {
        const types = component.types;
        const longName = component.long_name;

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
        }
    });

    return components;
}

/**
 * Filter predictions to only include hospitals and medical facilities
 * Uses strict filtering - only medical-related types
 */
function isHospital(types, name = '') {
    if (!Array.isArray(types)) return false;
    
    // Primary medical/hospital types (strict list)
    const primaryHospitalTypes = [
        'hospital',
        'health',
        'doctor',
        'dentist',
        'physiotherapist',
        'veterinary_care',
        'health_care',
        'medical_center',
        'clinic',
        'healthcare',
        'hospital_equipment_supply',
        'hospital_department',
        'general_hospital',
        'specialty_hospital',
        'physician',
        'surgeon',
        'cardiologist',
        'orthopedist',
        'pediatrician',
        'gynecologist',
        'neurologist',
        'oncology',
        'emergency_room',
        'urgent_care'
    ];
    
    // Check if any primary type matches
    const hasPrimaryType = types.some(type => primaryHospitalTypes.includes(type));
    
    if (hasPrimaryType) {
        return true;
    }
    
    // Secondary check: If name contains hospital-related keywords, allow it
    // But exclude if it has food/restaurant/shop types
    const nameLower = name.toLowerCase();
    const hospitalKeywords = ['hospital', 'clinic', 'medical', 'health', 'care', 'doctor', 'physician'];
    const hasHospitalKeyword = hospitalKeywords.some(keyword => nameLower.includes(keyword));
    
    if (hasHospitalKeyword) {
        // Exclude if it's clearly a food/restaurant/shop
        const excludeTypes = ['restaurant', 'food', 'cafe', 'bakery', 'store', 'shop', 'sweet', 'sweets', 'hotel', 'lodging'];
        const hasExcludeType = types.some(type => excludeTypes.some(exclude => type.includes(exclude)));
        
        if (hasExcludeType) {
            return false;
        }
        
        // Also check name for exclude keywords
        const excludeKeywords = ['sweet', 'sweets', 'restaurant', 'cafe', 'hotel', 'castle', 'palace', 'resort'];
        const hasExcludeKeyword = excludeKeywords.some(keyword => nameLower.includes(keyword));
        
        if (hasExcludeKeyword) {
            return false;
        }
        
        return true;
    }
    
    return false;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Check if coordinates match any existing hospital in database
 * Uses 50 meters tolerance for matching
 */
async function isExistingHospital(lat, lng) {
    try {
        // Get all hospitals with coordinates
        const hospitals = await Hospital.find({
            $or: [
                { 'origin.lat': { $exists: true }, 'origin.lng': { $exists: true } },
                { 'location.coordinates': { $exists: true, $ne: [] } }
            ]
        }).select('origin location');

        const TOLERANCE_METERS = 50; // 50 meters tolerance

        for (const hospital of hospitals) {
            let hospitalLat, hospitalLng;

            // Check origin field first (lat/lng format)
            if (hospital.origin && hospital.origin.lat && hospital.origin.lng) {
                hospitalLat = hospital.origin.lat;
                hospitalLng = hospital.origin.lng;
            }
            // Check location.coordinates field (GeoJSON format: [lng, lat])
            else if (hospital.location && 
                     Array.isArray(hospital.location.coordinates) && 
                     hospital.location.coordinates.length === 2) {
                hospitalLng = hospital.location.coordinates[0];
                hospitalLat = hospital.location.coordinates[1];
            } else {
                continue; // Skip hospitals without valid coordinates
            }

            // Calculate distance
            const distance = calculateDistance(lat, lng, hospitalLat, hospitalLng);
            
            // If within tolerance, it's an existing hospital
            if (distance <= TOLERANCE_METERS) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking existing hospitals:', error);
        // If there's an error, don't filter (return false to include the hospital)
        return false;
    }
}

export class HospitalAutocompleteService {
    /**
     * Search for hospitals using Google Places Autocomplete
     * @param {string} input - Search query (hospital name)
     * @param {string} sessionToken - Optional session token for billing
     * @param {Object} locationBias - Optional location bias {lat, lng}
     * @param {number} radiusMeters - Optional radius in meters
     * @param {string} country - Optional country code (e.g., 'IN')
     * @returns {Promise<Array>} Array of hospital suggestions
     */
    static async searchHospitals({ input, sessionToken, locationBias, radiusMeters, country }) {
        try {
            if (!input || typeof input !== 'string' || input.trim().length < 2) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Input must be a string with at least 2 characters'
                );
            }

            // Call Google Places Autocomplete
            const autocompleteResult = await placesAutocomplete({
                input: input.trim(),
                sessionToken,
                locationBias,
                radiusMeters,
                country
            });

            if (!autocompleteResult || !Array.isArray(autocompleteResult.predictions)) {
                return [];
            }

            // Filter for hospitals and get details
            const hospitalResults = [];
            
            console.log(`🔍 Processing ${autocompleteResult.predictions.length} predictions from Google Places`);
            
            for (const prediction of autocompleteResult.predictions) {
                // Get place details to check types
                try {
                    console.log(`📍 Fetching details for: ${prediction.description} (${prediction.place_id})`);
                    
                    const details = await placeDetails({
                        placeId: prediction.place_id,
                        sessionToken
                    });

                    const result = details?.result;
                    if (!result) {
                        console.log(`⚠️ No result for place ${prediction.place_id}`);
                        continue;
                    }

                    // Check if it's a hospital
                    const types = result.types || [];
                    const hospitalName = result.name || '';
                    console.log(`🏥 Types for ${hospitalName}:`, types);
                    
                    if (!isHospital(types, hospitalName)) {
                        console.log(`❌ Not a hospital type: ${hospitalName}`);
                        continue;
                    }

                    // Parse address components
                    const addressComponents = parseAddressComponents(result.address_components);
                    const location = result.geometry?.location;

                    if (!location) {
                        console.log(`⚠️ No location for ${result.name}`);
                        continue;
                    }

                    console.log(`✅ Hospital found: ${result.name} at ${location.lat}, ${location.lng}`);

                    // Check if this hospital already exists in our database
                    const exists = await isExistingHospital(location.lat, location.lng);
                    
                    // Skip if hospital already exists in database
                    if (exists) {
                        console.log(`🚫 Skipping existing hospital: ${result.name} at ${location.lat}, ${location.lng}`);
                        continue;
                    }

                    hospitalResults.push({
                        placeId: prediction.place_id,
                        hospitalName: result.name || prediction.structured_formatting?.main_text || 'Hospital',
                        location: {
                            street: addressComponents.street || '',
                            city: addressComponents.city || '',
                            state: addressComponents.state || '',
                            pincode: addressComponents.pincode || '',
                            country: addressComponents.country || ''
                        },
                        fullAddress: result.formatted_address || prediction.description,
                        coordinates: {
                            lat: location.lat,
                            lng: location.lng
                        },
                        description: prediction.description
                    });

                    console.log(`✅ Added hospital to results: ${result.name} (Total: ${hospitalResults.length})`);

                    // Limit to 10 results
                    if (hospitalResults.length >= 10) break;
                } catch (detailError) {
                    console.error(`❌ Error fetching details for place ${prediction.place_id}:`, detailError.message);
                    continue;
                }
            }
            
            console.log(`📊 Final results: ${hospitalResults.length} hospitals found`);

            return hospitalResults;
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'InternalServerError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to search hospitals: ${error.message}`
            );
        }
    }
}

