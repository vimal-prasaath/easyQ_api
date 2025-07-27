
import Hospital from "../model/hospital.js"
import HsptlFacilities from "../model/facility.js"
import HospitalReview from "../model/hospitalReview.js"
import Favourite from "../model/hospitalFavourite.js"
import { updateObjectPayload, updateFacilityPayload, updateComment, searchBylocation } from './update_controller.js'
import { EasyQError } from "../config/error.js"
import { httpStatusCode } from "../util/statusCode.js"
import {logInfo, logError} from "../config/logger.js"

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
        const allHospitals = await Hospital.find({});

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

        res.status(httpStatusCode.OK).json({
            message: 'Successfully retrieved hospital details',
            hospital: hospital,
            facilities: facilities,
            review: review,
            isfavourite: isFavouriteStatus
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

        if (Object.keys(query).length === 0) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                "Please provide either address or location for the search."
            ));
        }

        const allHospitals = await Hospital.find(query);
        res.status(httpStatusCode.OK).json({
            message: 'Hospitals fetch successfully',
            count: allHospitals.length,
            data: allHospitals
        });
    } catch (error) {
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

        await HsptlFacilities.deleteOne({ hospitalId: hospitalId });
        await HospitalReview.deleteOne({ hospitalId: hospitalId });
        await Favourite.deleteMany({ 'favouriteHospitals.hospitalId': hospitalId });

        res.status(httpStatusCode.OK).json({
            message: `Hospital "${deletedHospital.name}" (ID: ${hospitalId}) and its associated data deleted successfully.`,
            deletedHospital: {
                hospitalId: deletedHospital.hospitalId,
                name: deletedHospital.name
            },

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
    return await Hospital.find({ hospitalId: { $in: ids } });
}






