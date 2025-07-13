

import { FavouriteService } from '../services/favouriteService.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { httpStatusCode } from '../util/statusCode.js';

export async function getfavourite(req, res, next) {
    try {
        const { userId, hospitalId } = req.params;
        const result = await FavouriteService.getFavouriteStatus(userId, hospitalId);

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Favourite status retrieved successfully",
            data: result,
            statusCode: httpStatusCode.OK
        });

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function postfavourite(req, res, next) {
    try {
        const { userId, hospitalId, favourite } = req.body;
        const result = await FavouriteService.updateFavouriteStatus(userId, hospitalId, favourite);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: { isFavourite: result.isFavourite },
            statusCode: httpStatusCode.OK
        });

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function getUserFavourites(req, res, next) {
    try {
        const { userId } = req.params;
        const { page, limit, sortBy, sortOrder } = req.query;
        const options = { page: Number(page), limit: Number(limit), sortBy, sortOrder };

        const result = await FavouriteService.getUserFavourites(userId, options);

        const response = ResponseFormatter.formatSuccessResponse({
            message: "User favourites retrieved successfully",
            data: result.favourites,
            meta: { pagination: result.pagination },
            statusCode: httpStatusCode.OK
        });

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function removeFavourite(req, res, next) {
    try {
        const { userId, hospitalId } = req.params;
        const result = await FavouriteService.removeFavourite(userId, hospitalId);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: { userId, hospitalId },
            statusCode: httpStatusCode.OK
        });

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }
}

export async function clearAllFavourites(req, res, next) {
    if (!userId || !hospitalId || typeof favourite !== 'boolean') {
        return next(new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'User ID, Hospital ID, and a boolean favourite status are required.'
        ));
    }

    try {
        const { userId } = req.params;
        const result = await FavouriteService.clearAllFavourites(userId);

        const response = ResponseFormatter.formatSuccessResponse({
            message: result.message,
            data: { userId },
            statusCode: httpStatusCode.OK
        });

        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        next(error);
    }

}


