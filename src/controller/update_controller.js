

export const updateObjectPayload = (data) => {
   const allowedUpdates = [
        'name',
        'email',
        'phoneNumber',
        'hospitalType',
        'imageUrl',
        'ambulanceNumber',
        'location',
        'address',
        'departments'
    ];
    return constructObject({}, allowedUpdates, data);

}

const constructObject = (updateData, allowedUpdates, data) => {

    for (const key of Object.keys(data)) {
        if (allowedUpdates.includes(key)) {
            if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key]) &&
                (key === 'address' || key === 'location' || key === 'departments')) {
                updateData[key] = {};
                constructObject(updateData[key], allowedUpdates, data[key]);
            } else {
                updateData[key] = data[key];
            }
        }
    }
    return updateData;
}

export const updateFacilityPayload = (data) => {
     const allowedUpdates = [
        'facilities',
        'labs'
    ];

    const updateData = {};
    for (const key of Object.keys(data)) {
        if (allowedUpdates.includes(key)) {
            updateData[key] = data[key];
        }
    }
    return updateData;
}

export const updateComment = async (data, hospitalId) => {
    const { rating, comment } = data;
    if ((comment === undefined || comment === null || (typeof comment === 'string' && comment.trim().length === 0)) && rating === undefined) {
        throw new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            "Comment or rating is required to update a review."
        );
    }
    const updateFields = {};
    if (comment !== undefined) {
        updateFields.comment = comment;
    }
    const averageRating = await updateReview(updateFields, rating, hospitalId);
    return { updateFields, averageRating }
}

export const updateReview = async (updateFields, rating) => {
    try {
        if (rating !== undefined) {
            updateFields.rating = rating;
        }

        let newAverageRating = 0;
        if (!hospitalId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                "Hospital ID is required to calculate average rating."
            );
        }

        const result = await Reviews.aggregate([
            { $match: { hospitalId: hospitalId } },
            {
                $group: {
                    hospitalId: '$hospitalId',
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        if (result.length > 0) {
            newAverageRating = parseFloat(result[0].averageRating.toFixed(1));
        }
        return newAverageRating;

    } catch (error) {
        if (error instanceof EasyQError) {
            throw error;
        }
        throw new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to update review or calculate average rating: ${error.message}`
        );
    }
}

export const searchBylocation = (data) => {
     const { address, location } = data;
    let query = {};

    if (address) {
        if (address.street) query['address.street'] = address.street;
        if (address.city) query['address.city'] = address.city;
        if (address.state) query['address.state'] = address.state;
        if (address.zipCode) query['address.zipCode'] = address.zipCode;
        if (address.country) query['address.country'] = address.country;
    }

    if (location && location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
        query.location = {
            $nearSphere: {
                $geometry: {
                    type: 'Point',
                    coordinates: location.coordinates,
                },
            },
        };
    }
    return query;
}







