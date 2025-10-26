
import Hospital from "../model/hospital.js"
import HsptlFacilities from "../model/facility.js"
import HospitalReview from "../model/hospitalReview.js"
import Favourite from "../model/hospitalFavourite.js"
import Doctor from "../model/doctor.js"
import Appointment from "../model/appointment.js"
import HospitalDetails from "../model/facility.js"
import User from "../model/userProfile.js"
import { updateObjectPayload, updateFacilityPayload, updateComment, searchBylocation } from './update_controller.js'
import { EasyQError } from "../config/error.js"
import { httpStatusCode } from "../util/statusCode.js"
import {logInfo, logError, logWarn} from "../config/logger.js"
import { deleteFolderFromFirebase } from "../config/fireBaseStorage.js"
import { calculateUserHospitalDistance, calculateApproximateTravelTime } from '../util/distanceCalculator.js'

export async function createHospital(req, res, next) {

    try {
        const data = req.body;
        if (!data.name || !data.email || !data.phoneNumber) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital name, email, and phone number are required.'
            ));
        }

        // Check if hospital with this email already exists to avoid duplicates
        const existingHospital = await Hospital.findOne({ email: data.email });
        if (existingHospital) {
            return next(new EasyQError(
                'ConflictError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital with this email already exists.'
            ));
        }

        const hospital = await Hospital.create(data);
        res.status(httpStatusCode.CREATED).json({
            message: "Hospital Data is Created Successfully",
            hospitalId: hospital.hospitalId
        });
    } catch (error) {
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to create hospital: ${error.message}`
        ));
    }

}
export async function hospitalFacility(req, res, next) {

    try {
        const data = req.body;
        if (!data.hospitalId || !data.facilities || !data.labs) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID, facilities, and labs are required.'
            ));
        }

        const hsptl = await Hospital.findOne({ hospitalId: data.hospitalId });
        if (!hsptl) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                "Hospital not found with the provided ID."
            ));
        }

        const facilities = await HsptlFacilities.create(data);
        res.status(httpStatusCode.CREATED).json({
            message: "Facilities data saved successfully",
        });
    } catch (error) {
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to save hospital facilities: ${error.message}`
        ));
    }
}
export async function createReviews(req, res, next) {
    try {
        const data = req.body;
       

        const hsptl = await Hospital.findOne({ hospitalId: data.hospitalId });
        if (!hsptl) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                "Hospital not found with the provided ID."
            ));
        }

        const reviews = await HospitalReview.create(data);
        
         const hospitalId = data.hospitalId;

         const hospitalRatingStats = await HospitalReview.aggregate([
            {
                $match: {
                    hospitalId: hospitalId,
                    status: { $in: ['Pending', 'Approved'] }
                }
            },
            {
                $group: {
                    _id: '$hospitalId',
                    averageRating: { $avg: '$overallRating' }
                }
            }
        ]);

        let newHospitalAverageRating = 0;
        if (hospitalRatingStats.length > 0) {
            newHospitalAverageRating = hospitalRatingStats[0].averageRating;
        }

        const updatedHospital = await Hospital.findOneAndUpdate(
            { hospitalId: hospitalId },
            { $set: { averageRating: newHospitalAverageRating } },
            { new: true, runValidators: true }
        );

        if (updatedHospital) {
            logInfo(`Hospital ${hospitalId} average rating updated to ${newHospitalAverageRating}.`);
        } else {
            logError(`Failed to update average rating for hospital ${hospitalId}. Hospital not found during update.`);
        }

        res.status(httpStatusCode.CREATED).json({
            message: "Review saved successfully",
            reviewId: reviews._id
        });
    } catch (error) {
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to save review: ${error.message}`
        ));
    }

}

export const updateHospitalBasicDetails = async (req, res, next) => {

    const { hospitalId } = req.params;
    try {

        const updateData = updateObjectPayload(req.body);
        const updatedHospital = await Hospital.findOneAndUpdate(
            { hospitalId: hospitalId },
            { $set: updateData },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!updatedHospital) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Hospital not found with the provided ID.'
            ));
        }

        res.status(httpStatusCode.OK).json({
            message: 'Hospital basic details updated successfully',
            hospital: updatedHospital
        });

    } catch (error) {
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Hospital ID format: ${hospitalId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error updating hospital basic details: ${error.message}`
        ));
    }
};

export async function updateFacility(req, res, next) {
    const { hospitalId } = req.params;
    const updateData = updateFacilityPayload(req.body);

    try {
        const updatedDetails = await HsptlFacilities.findOneAndUpdate(
            { hospitalId: hospitalId },
            { $set: updateData },
            {
                new: true,
                runValidators: true,
                upsert: true,
                context: 'query'
            }
        );

        if (updatedDetails.isNew) {
            const hospitalExists = await Hospital.findOne({ hospitalId: hospitalId });
            if (!hospitalExists) {
                console.warn(`HospitalFacilities document created for non-existent Hospital ID: ${hospitalId}`);
            }
        }

        res.status(httpStatusCode.OK).json({
            message: 'Hospital facilities and details updated successfully',
            details: updatedDetails
        });

    } catch (error) {
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Hospital ID format: ${hospitalId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error updating hospital facilities/details: ${error.message}`
        ));
    }
}

export async function updateReviewComment(req, res, next) {
    const { hospitalId } = req.params;
    const { updateFields, averageRating } = await updateComment(req.body, hospitalId);

    try {
        const hospitalExists = await Hospital.findOne({ hospitalId: hospitalId });
        if (!hospitalExists) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Hospital not found with the provided ID.'
            ));
        }

        const updatedReview = await HospitalReview.findOneAndUpdate(
            { hospitalId: hospitalId },
            { $set: updateFields },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!updatedReview) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Review not found for this hospital or review ID.'
            ));
        }

        const hospitalRatingStats = await HospitalReview.aggregate([
            {
                $match: {
                    hospitalId: hospitalId,
                    status: { $in: ['Pending', 'Approved'] }
                }
            },
            {
                $group: {
                    _id: '$hospitalId',
                    averageRating: { $avg: '$overallRating' }
                }
            }
        ]);

        let newHospitalAverageRating = 0;
        if (hospitalRatingStats.length > 0) {
            newHospitalAverageRating = hospitalRatingStats[0].averageRating;
        }

        const updatedHospital = await Hospital.findOneAndUpdate(
            { hospitalId: hospitalId },
            { $set: { averageRating: newHospitalAverageRating } },
            { new: true, runValidators: true }
        );

        if (updatedHospital) {
            logInfo(`Hospital ${hospitalId} average rating updated to ${newHospitalAverageRating}.`);
        } else {
            logError(`Failed to update average rating for hospital ${hospitalId}. Hospital not found during update.`);
        }

        // Update average rating on the Hospital document
        await Hospital.updateOne(
            { hospitalId: hospitalId },
            { $set: { averageRating: averageRating } }
        );

        res.status(httpStatusCode.OK).json({
            message: 'Review updated successfully',
            review: updatedReview
        });

    } catch (error) {
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Hospital ID format: ${hospitalId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error updating review: ${error.message}`
        ));
    }
}

export async function getAllHospitalDetails(req, res, next) {
    try {
        const allHospitals = await  Hospital.find({ isActive: true });

        res.status(httpStatusCode.OK).json({
            message: 'Successfully retrieved all hospital basic details',
            count: allHospitals.length,
            hospitals: allHospitals
        });

    } catch (error) {
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error fetching all hospital basic details: ${error.message}`
        ));
    }
}


export async function getHospitalDetails(req, res, next) {
    const { userId, hospitalId } = req.params;
    try {
        if (!hospitalId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required.'
            ));
        }

        const hospital = await Hospital.findOne({ hospitalId: hospitalId });
        if (!hospital) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Hospital not found.'
            ));
        }

        const facilities = await getHsptlFacilities(hospitalId);
        const review = await getHsptlReviews(hospitalId);

        const favouriteDoc = await Favourite.findOne(
            {
                userId: userId,
                "favouriteHospitals.hospitalId": hospitalId
            },
            {
                "favouriteHospitals.$": 1,
                _id: 0
            }
        );

        let isFavouriteStatus = false;
        if (favouriteDoc && favouriteDoc.favouriteHospitals && favouriteDoc.favouriteHospitals.length > 0) {
            const matchedHospital = favouriteDoc.favouriteHospitals[0];
            isFavouriteStatus = matchedHospital.isFavourite;
        }

        // Calculate distance and travel time between user and hospital
        const user = await User.findOne({ userId: userId });
        const distance = user ? calculateUserHospitalDistance(user, hospital) : null;
        const approximateTime = user ? await calculateApproximateTravelTime(user, hospital) : null;

        res.status(httpStatusCode.OK).json({
            message: 'Successfully retrieved hospital details',
            hospital: hospital,
            facilities: facilities,
            review: review,
            isfavourite: isFavouriteStatus,
            distance: distance, // Distance in kilometers
            approximateTime: approximateTime // Travel time range like "10-15 min"
        });

    } catch (error) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Hospital ID format: ${hospitalId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error fetching hospital details: ${error.message}`
        ));
    }

}

export async function getHospitalDetailsBylocation(req, res, next) {
    try {
        const query = searchBylocation(req.body);
        let allHospitals;

        // If no search criteria provided but patientId exists, get all active hospitals
        if (Object.keys(query).length === 0 && req.body.patientId) {
            allHospitals = await Hospital.find({ isActive: true }).lean();
            logInfo('No search criteria provided, fetching all active hospitals for patient', {
                patientId: req.body.patientId,
                hospitalCount: allHospitals.length
            });
        } else if (Object.keys(query).length === 0) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                "Please provide either address, location, or patientId for the search."
            ));
        } else {
            allHospitals = await Hospital.find({ ...query, isActive: true }).lean();
        }
        
        // Add distance and travel time calculation
        let userForCalculation = null;

        
        // Priority 1: Use patientId from request body to get user's address
        if (req.body.patientId) {
            logInfo('Looking up patient for distance calculation', {
                patientId: req.body.patientId
            });
            
            const user = await User.findOne({ userId: req.body.patientId });
            if (user) {
                userForCalculation = user;
                logInfo('Using patient address for distance calculation', {
                    patientId: req.body.patientId,
                    hasDefaultAddress: !!user.addresses?.find(addr => addr.isDefault),
                    totalAddresses: user.addresses?.length || 0,
                    addresses: user.addresses?.map(addr => ({
                        isDefault: addr.isDefault,
                        hasOrigin: !!addr.origin,
                        origin: addr.origin
                    })) || []
                });
            } else {
                logWarn('Patient not found, falling back to location coordinates', {
                    patientId: req.body.patientId
                });
            }
        }
        
        // Priority 2: Fallback to location coordinates from request body
        if (!userForCalculation && req.body.location && req.body.location.coordinates && Array.isArray(req.body.location.coordinates) && req.body.location.coordinates.length === 2) {
            const [lng, lat] = req.body.location.coordinates; // GeoJSON format: [longitude, latitude]
            
            // Create a mock user object with the provided coordinates
            userForCalculation = {
                addresses: [{
                    isDefault: true,
                    origin: { lat, lng }
                }]
            };
            
            logInfo('Using location coordinates for distance calculation', {
                coordinates: [lng, lat]
            });
        }
        
        // Calculate distance and travel time if we have user data or coordinates
        if (userForCalculation) {
            logInfo('Starting distance and travel time calculation', {
                hospitalCount: allHospitals.length,
                calculationMethod: req.body.patientId ? 'patient_address' : 'location_coordinates',
                userAddresses: userForCalculation.addresses?.length || 0
            });
            
            // Process all hospitals in parallel and add distance/time information
            await Promise.all(allHospitals.map(async (hospital, index) => {
                try {
                    // Convert Decimal128 coordinates to regular numbers
                    if (hospital.location?.coordinates) {
                        hospital.location.coordinates = hospital.location.coordinates.map(coord => 
                            coord.toString ? parseFloat(coord.toString()) : coord
                        );
                    }
                    
                    const distance = calculateUserHospitalDistance(userForCalculation, hospital);
                    let approximateTime = null;
                    
                    // Try to get travel time, but don't fail if it doesn't work
                    try {
                        approximateTime = await calculateApproximateTravelTime(userForCalculation, hospital);
                    } catch (etaError) {
                        logWarn('ETA calculation failed, using distance only', {
                            hospitalId: hospital.hospitalId,
                            error: etaError.message
                        });
                        // Set a fallback time based on distance (rough estimate: 1km = 2 minutes)
                        if (distance) {
                            const estimatedMinutes = Math.ceil(distance * 2);
                            if (estimatedMinutes <= 1) approximateTime = "1-5 min";
                            else if (estimatedMinutes <= 5) approximateTime = "1-5 min";
                            else if (estimatedMinutes <= 10) approximateTime = "5-10 min";
                            else if (estimatedMinutes <= 15) approximateTime = "10-15 min";
                            else if (estimatedMinutes <= 30) approximateTime = "15-30 min";
                            else if (estimatedMinutes <= 45) approximateTime = "30-45 min";
                            else if (estimatedMinutes <= 60) approximateTime = "45-60 min";
                            else if (estimatedMinutes <= 75) approximateTime = "60-75 min";
                            else approximateTime = "75+ min";
                        }
                    }
                    
                    // Add distance and time to the hospital object (mutating the original array)
                    allHospitals[index].distance = distance;
                    allHospitals[index].approximateTime = approximateTime;
                    logInfo('Distance calculation result for hospital', {
                        hospitalId: hospital.hospitalId,
                        hospitalName: hospital.name,
                        distance: distance,
                        approximateTime: approximateTime
                    });
                } catch (error) {
                    logError('Error calculating distance for hospital', {
                        hospitalId: hospital.hospitalId,
                        error: error.message
                    });
                    allHospitals[index].distance = null;
                    allHospitals[index].approximateTime = null;
                }
            }));

            logInfo('Distance and travel time calculation completed', {
                hospitalCount: allHospitals.length,
                calculationMethod: req.body.patientId ? 'patient_address' : 'location_coordinates'
            });
        } else {
            logInfo('No distance calculation performed - no patientId or location coordinates provided');
        }
        
        res.status(httpStatusCode.OK).json({
            message: 'Hospitals fetch successfully',
            count: allHospitals.length,
            data: allHospitals
        });
    } catch (error) {
        logError('Error in getHospitalDetailsBylocation', {
            error: error.message,
            patientId: req.body?.patientId,
            hasLocation: !!req.body?.location
        });
        console.log(error);
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error fetching hospital details by location: ${error.message}`
        ));
    }
}
export async function getHsptlFacilities(hospitalId) {

    try {
        const facilities = await HsptlFacilities.findOne({ hospitalId: hospitalId });
        return facilities;
    } catch (error) {
        throw new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to retrieve hospital facilities: ${error.message}`
        );
    }
}

export async function getHsptlReviews(hospitalId) {

    try {
        const reviews = await HospitalReview.findOne({ hospitalId: hospitalId });
        return reviews;
    } catch (error) {
        throw new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to retrieve hospital reviews: ${error.message}`
        );
    }
}

export async function deleteHsptl(req, res, next) {
    const { hospitalId } = req.params;

    try {
        if (!hospitalId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required.'
            ));
        }

        const deletedHospital = await Hospital.findOneAndDelete({ hospitalId: hospitalId });

        if (!deletedHospital) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Hospital not found with the provided ID.'
            ));
        }

        // Delete Firebase files for this hospital
        let firebaseDeletionResult = { deletedCount: 0 };
        try {
            firebaseDeletionResult = await deleteFolderFromFirebase(`hospitals/${hospitalId}`);
        } catch (error) {
            logError(`Error deleting Firebase files for hospital ${hospitalId}:`, error);
        }

        // Delete all associated data
        await HsptlFacilities.deleteOne({ hospitalId: hospitalId });
        await HospitalReview.deleteOne({ hospitalId: hospitalId });
        await Favourite.deleteMany({ 'favouriteHospitals.hospitalId': hospitalId });
        
        // Delete doctors associated with this hospital
        await Doctor.deleteMany({ hospitalId: hospitalId });
        
        // Delete appointments associated with this hospital
        await Appointment.deleteMany({ hospitalId: hospitalId });
        
        // Delete hospital facilities
        await HospitalDetails.deleteOne({ hospitalId: hospitalId });

        res.status(httpStatusCode.OK).json({
            message: `Hospital "${deletedHospital.name}" (ID: ${hospitalId}) and its associated data deleted successfully.`,
            deletedHospital: {
                hospitalId: deletedHospital.hospitalId,
                name: deletedHospital.name
            },
            firebaseDeletion: {
                hospitalFiles: firebaseDeletionResult
            }
        });

    } catch (error) {
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Hospital ID format: ${hospitalId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error deleting hospital and associated data: ${error.message}`
        ));
    }
}

export async function getHospitalsByIds(ids) {
    return await Hospital.find({ hospitalId: { $in: ids }, isActive: true });
}   

export const getAllInActiveHsptl = async (req, res, next) => {
    try {
        const inactiveHospitals = await Hospital.find({ isActive: false });
        
        res.status(httpStatusCode.OK).json({
            success: true,
            count: inactiveHospitals.length,
            data: inactiveHospitals
        });
    } catch (error) {
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error fetching inactive hospitals: ${error.message}`
        ));
    }
};

export const activateHsptl = async (req, res, next) => {
    const { hospitalId } = req.body;

    if (!hospitalId) {
        return next(new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'Hospital ID is required.'
        ));
    }

    try {
        const hospital = await Hospital.findOneAndUpdate(
            { hospitalId },
            { isActive: true },
            { new: true }
        );

        if (!hospital) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `No hospital found with ID: ${hospitalId}`
            ));
        }

        res.status(httpStatusCode.OK).json({
            success: true,
            message: `Hospital ${hospital.name} has been activated.`,
            data: hospital
        });
    } catch (error) {
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error activating hospital: ${error.message}`
        ));
    }
};

// Add facilities to hospital
export async function addFacilities(req, res, next) {
    const startTime = Date.now();
    
    logApiRequest(req, { action: 'add_facilities' });

    try {
        const { hospitalId } = req.params;
        const facilitiesData = req.body;
        
        if (!hospitalId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "hospitalId is required in URL parameters",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }

        if (!facilitiesData || !Array.isArray(facilitiesData.facilities)) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "facilities array is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }

        hospitalLogger.info('Add facilities started', {
            userId: req.user?.userId,
            hospitalId: hospitalId,
            facilitiesCount: facilitiesData.facilities.length
        });

        const result = await HospitalService.addFacilities(hospitalId, facilitiesData.facilities);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Facilities added successfully",
            data: result,
            statusCode: httpStatusCode.CREATED
        });

        hospitalLogger.info('Facilities added successfully', {
            userId: req.user?.userId,
            hospitalId: hospitalId,
            addedCount: result.addedCount
        });

        logPerformance('Add Facilities', Date.now() - startTime, {
            hospitalId: hospitalId,
            userId: req.user?.userId
        });

        logApiResponse(req, res, response, { 
            action: 'add_facilities_success',
            hospitalId: hospitalId 
        });
        
        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        hospitalLogger.error('Add facilities error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            hospitalId: req.params.hospitalId
        });
        next(error);
    }
}

// Update facilities
export async function updateFacilities(req, res, next) {
    const startTime = Date.now();
    
    logApiRequest(req, { action: 'update_facilities' });

    try {
        const { hospitalId } = req.params;
        const facilitiesData = req.body;
        
        if (!hospitalId) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "hospitalId is required in URL parameters",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }

        if (!facilitiesData || !Array.isArray(facilitiesData.facilities)) {
            return res.status(httpStatusCode.BAD_REQUEST).json(
                ResponseFormatter.formatErrorResponse({
                    message: "facilities array is required in request body",
                    statusCode: httpStatusCode.BAD_REQUEST
                })
            );
        }

        hospitalLogger.info('Update facilities started', {
            userId: req.user?.userId,
            hospitalId: hospitalId,
            facilitiesCount: facilitiesData.facilities.length
        });

        const result = await HospitalService.updateFacilities(hospitalId, facilitiesData.facilities);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Facilities updated successfully",
            data: result,
            statusCode: httpStatusCode.OK
        });

        hospitalLogger.info('Facilities updated successfully', {
            userId: req.user?.userId,
            hospitalId: hospitalId,
            updatedCount: result.updatedCount
        });

        logPerformance('Update Facilities', Date.now() - startTime, {
            hospitalId: hospitalId,
            userId: req.user?.userId
        });

        logApiResponse(req, res, response, { 
            action: 'update_facilities_success',
            hospitalId: hospitalId 
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        hospitalLogger.error('Update facilities error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.userId,
            hospitalId: req.params.hospitalId
        });
        next(error);
    }
}






