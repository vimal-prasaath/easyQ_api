import Favourite from '../model/hospitalFavourite.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

export class FavouriteService {
    
    static async getFavouriteStatus(userId, hospitalId) {
        try {
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

            return { isFavourite: isFavouriteStatus };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve favourite status: ${error.message}`
            );
        }
    }

    static async updateFavouriteStatus(userId, hospitalId, favourite) {
        try {
            const existingFavourite = await Favourite.findOne({ userId: userId });

            if (!existingFavourite) {
                const newFavourite = new Favourite({
                    userId: userId,
                    favouriteHospitals: [{
                        hospitalId: hospitalId,
                        isFavourite: favourite
                    }]
                });

                await newFavourite.save();
                return {
                    message: 'Favourite status updated successfully',
                    isFavourite: favourite
                };
            } else {
                const hospitalIndex = existingFavourite.favouriteHospitals.findIndex(
                    hosp => hosp.hospitalId === hospitalId
                );

                if (hospitalIndex !== -1) {
                    existingFavourite.favouriteHospitals[hospitalIndex].isFavourite = favourite;
                } else {
                    existingFavourite.favouriteHospitals.push({
                        hospitalId: hospitalId,
                        isFavourite: favourite
                    });
                }

                await existingFavourite.save();
                return {
                    message: 'Favourite status updated successfully',
                    isFavourite: favourite
                };
            }
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to update favourite status: ${error.message}`
            );
        }
    }

    static async getUserFavourites(userId, options = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
            const skip = (page - 1) * limit;

            const favourites = await Favourite.findOne({ userId: userId })
                .populate('favouriteHospitals.hospitalId', 'name address phone email')
                .select('-_id -__v');

            if (!favourites || !favourites.favouriteHospitals) {
                return {
                    favourites: [],
                    pagination: {
                        currentPage: page,
                        totalPages: 0,
                        totalCount: 0,
                        hasNext: false,
                        hasPrev: false
                    }
                };
            }

            const activeFavourites = favourites.favouriteHospitals.filter(fav => fav.isFavourite);
            const sortedFavourites = activeFavourites.sort((a, b) => {
                const order = sortOrder === 'desc' ? -1 : 1;
                return order * (new Date(b.createdAt) - new Date(a.createdAt));
            });

            const paginatedFavourites = sortedFavourites.slice(skip, skip + limit);
            const totalCount = activeFavourites.length;

            return {
                favourites: paginatedFavourites,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalCount,
                    hasNext: page < Math.ceil(totalCount / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to retrieve user favourites: ${error.message}`
            );
        }
    }

    static async removeFavourite(userId, hospitalId) {
        try {
            const result = await Favourite.updateOne(
                { userId: userId },
                { $pull: { favouriteHospitals: { hospitalId: hospitalId } } }
            );

            if (result.modifiedCount === 0) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Favourite not found or already removed'
                );
            }

            return { message: 'Favourite removed successfully' };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to remove favourite: ${error.message}`
            );
        }
    }

    static async clearAllFavourites(userId) {
        try {
            const result = await Favourite.updateOne(
                { userId: userId },
                { $set: { favouriteHospitals: [] } }
            );

            if (result.matchedCount === 0) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'No favourites found for this user'
                );
            }

            return { message: 'All favourites cleared successfully' };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to clear favourites: ${error.message}`
            );
        }
    }
}


