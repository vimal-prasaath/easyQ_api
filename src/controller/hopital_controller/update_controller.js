

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
    try {
        const updateData = {};
        return constructObject(updateData, allowedUpdates, data)
    } catch (e) {
        console.log(e)
    }

}

const constructObject = (updateData, allowedUpdates, data) => {

    for (const key of Object.keys(data)) {
        if (allowedUpdates.includes(key)) {
            updateData[key] = data[key];
            if (key === 'address' || key === 'location' || key === 'departments') {
                constructObject(updateData, allowedUpdates, data[key])
            }
        }
    }
    console.log(updateData, "UpdateData")
    return updateData
}

export const updateFacilityPayload = (data) => {
    try {

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
        return updateData
    } catch (e) {
        console.log(e)
    }
}

export const updateComment = async (data, hospitalId) => {
    const { rating, comment } = data;
    try {
        if ((comment === undefined || comment === null || (typeof comment === 'string' && comment.trim().length === 0)) && rating === undefined) {
            throw new Error(" comment is required")
        }
        const updateFields = {};
        if (comment !== undefined) {
            updateFields.comment = comment;
        }
        const averageRating = await updateReview(updateFields, rating, hospitalId)
        return { updateFields, averageRating }
    } catch (e) {
        console.log(e)
    }
}

export const updateReview = async (updateFields, rating) => {
    try {
        if (rating !== undefined) {
            updateFields.rating = rating;
        }
        let newAverageRating = 0;
        const result = await Reviews.aggregate([
            { $match: { hospitalId: hospitalId } },
            {
                $group: {
                    _id: '$hospitalId',
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        if (result.length > 0) {
            newAverageRating = parseFloat(result[0].averageRating.toFixed(1));
        }
        return newAverageRating

    } catch (e) {
        console.log(e)
    }
}

export const searchBylocation = (data) => {
      const { address, location } = data;
    try {
        let query = {};

        if (address) {
            const addressQuery = {};
            if (address.street) query['address.street'] = address.street;
            if (address.city) query['address.city'] = address.city;
            if (address.state) query['address.state'] = address.state;
            if (address.zipCode) query['address.zipCode'] = address.zipCode;
            if (address.country) query['address.country'] = address.country;

            if (Object.keys(addressQuery).length > 0) {
                Object.assign(query, addressQuery);
            }
        }

        if (location && location.coordinates) {
            query.location = {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: location.coordinates,
                    },
                },
            };
        }
        return query
    } catch (e) {
        console.log(e)
    }
}