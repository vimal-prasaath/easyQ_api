import Favourite from "../model/hospital/favourite.js"
import { favpipline } from "./favouritepipeline.js";
import { EasyQError } from '../config/error.js'; 
import { httpStatusCode } from '../util/statusCode.js'
export async function getfavourite(req, res ,next) {
   try {
        const { userId, hospitalId } = req.params;

        if (!userId || !hospitalId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID and Hospital ID are required.'
            ));
        }

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

        res.status(httpStatusCode.OK).json({ isFavourite: isFavouriteStatus });

    } catch (error) {
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to retrieve favourite status: ${error.message}`
        ));
    }
}

export async function postfavourite(req, res,next) {
  try {
        const { userId, hospitalId, favourite } = req.body;

        if (!userId || !hospitalId || typeof favourite !== 'boolean') { 
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID, Hospital ID, and a boolean favourite status are required.'
            ));
        }
        
        
        const pipeline = favpipline(hospitalId, favourite); 

        const updatedFavouriteDoc = await Favourite.findOneAndUpdate(
            { userId: userId },
            pipeline,
            {
                upsert: true,
                new: true,
                runValidators: true 
            }
        );

        res.status(httpStatusCode.OK).json({ 
            message: `Favourite status updated`,
            favouriteStatus: favourite 
        });

    } catch (error) { 
      if (error instanceof EasyQError) { 
            return next(error);
        }
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
            `Failed to update favourite status: ${error.message}`
        ));
    }

}
