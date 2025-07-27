

import { FavouriteService } from '../services/favouriteService.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { httpStatusCode } from '../util/statusCode.js';
import {getHospitalsByIds} from "../controller/hospital.js"
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



export async function getfavouriteById(req, res, next) {
    try {
        console.log(req,"user")
        const { userId } = req.params;

        // Step 1: Find user's favourite hospitals
        const favouriteData = await FavouriteService.getfavouriteById( userId );

        if (!favouriteData) {
            return res.status(200).json({
                success: true,
                message: 'No favourite found',
                data: [],
            });
        }
       console.log(favouriteData,"kkkk")
        // Step 2: Extract only the hospitalIds where isFavourite = true
        const favHospitalIds = favouriteData.favouriteHospitals
            .filter(h => h.isFavourite)
            .map(h => h.hospitalId);

        if (favHospitalIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No favourite hospitals found',
                data: [],
            });
        }

        // Step 3: Fetch hospital details
        const hospitals = await getHospitalsByIds(favHospitalIds);
       console.log(hospitals,"khhh")
            
        // Step 4: Attach isFavourite: true to each hospital
        const hospitalsWithFavouriteFlag = hospitals.map(h => ({
            ...h.toObject(),
            isFavourite: true
        }));

        // Final response
        return res.status(200).json({
            success: true,
            message: 'Favourite hospitals retrieved successfully',
            data: hospitalsWithFavouriteFlag
        });

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


