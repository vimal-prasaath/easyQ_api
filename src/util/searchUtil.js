import SearchSuggestion from "../model/search.js";
export const buildSearchPipeline = (parms) => {
    try {
        const pipeline = [];
        const matchCondition = {};

        if (!parms || typeof parms !== 'object') {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Invalid search parameters provided. Must be an object.'
            );
        }

        if (parms.name) {
            matchCondition.name = { $regex: parms.name, $options: 'i' };
        }
        if (parms.city) {
            matchCondition['address.city'] = { $regex: parms.city, $options: "i" };
        }
        if (parms.state) {
            matchCondition['address.state'] = { $regex: parms.state, $options: "i" };
        }
        if (parms.treatmentType) {
            matchCondition['departments.name'] = { $regex: parms.treatmentType, $options: 'i' };
        }

        if (Object.keys(matchCondition).length > 0) {
            pipeline.push({
                $match: matchCondition
            });
        }

        pipeline.push({
            $project: {
                _id: 0,
                hospitalId: "$hospitalId",
                name: 1,
                email: 1,
                departments: 1,
                hospitalType: 1,
                phoneNumber: 1,
                address: 1,
                imageUrl: 1,
                averageRating: 1
            }
        });

        return pipeline;

    } catch (error) {
        if (error instanceof EasyQError) {
            throw error;
        }
        throw new EasyQError(
            'PipelineConstructionError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error constructing search pipeline: ${error.message}`
        );
    }
};
export const constructLastquery = async (searchParams) => {
    try {
        if (!searchParams || typeof searchParams !== 'object') {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Invalid search parameters provided for last query construction. Must be an object.'
            );
        }
        const lastquery = [];
        for (const key in searchParams) {
            if (Object.prototype.hasOwnProperty.call(searchParams, key)) {
                const value = searchParams[key];
                if (typeof value === 'string') {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== '' && key !== 'userId') {
                        lastquery.push(trimmedValue);
                    }
                } else if (Array.isArray(value)) {
                    for (const item of value) {
                        if (typeof item === 'string') {
                            const trimmedItem = item.trim();
                            if (trimmedItem !== '') {
                                lastquery.push(trimmedItem);
                            }
                        }
                    }
                }
            }
        }
        return lastquery;
    } catch (error) {
        if (error instanceof EasyQError) {
            throw error;
        }
        throw new EasyQError(
            'QueryConstructionError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error constructing last query: ${error.message}`
        );
    }
}


export const lastqueryUpdate = async (userId, searchQueryString) => {
    try {
        if (!userId || typeof userId !== 'string') {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID is required for last query update.'
            );
        }
        if (!searchQueryString || typeof searchQueryString !== 'string') {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Search query string is required for last query update.'
            );
        }

        await SearchSuggestion.findOneAndUpdate(
            { userId: userId },
            [
                {
                    $set: {
                        lastquery: {
                            $filter: {
                                input: { $ifNull: ["$lastquery", []] },
                                as: "item",
                                cond: { $ne: ["$$item", searchQueryString] }
                            }
                        }
                    }
                },
                {
                    $set: {
                        lastquery: { $concatArrays: [[searchQueryString], "$lastquery"] }
                    }
                },
                {
                    $set: {
                        lastquery: { $slice: ["$lastquery", 0, 3] },
                        lastSearchedAt: new Date()
                    }
                }
            ],
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );
    } catch (error) {
        if (error instanceof EasyQError) {
            throw error;
        }
        if (error.name === 'CastError') {
            throw new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid ID format provided for last query update.`
            );
        }
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            );
        }

        throw new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to update last query: ${error.message}`
        );
    }
}
