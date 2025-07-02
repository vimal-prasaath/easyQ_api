import Favourite from "../model/hospital/favourite.js"
import { favpipline } from "./favouritepipeline.js";
export async function getfavourite(req, res) {
    try {
        const { userId, hospitalId } = req.params
        if (!hospitalId) {
            return res.status(400).json({ message: "hospitalId is required" });
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

        res.status(200).json({ isFavourite: isFavouriteStatus });

    } catch (e) {
        console.log(e)
    }
}

export async function postfavourite(req, res) {
    try {
        const { userId, hospitalId, favourite } = req.body
        const pipeline=favpipline(hospitalId,favourite)
        if (!userId || !hospitalId) {
            return res.status(400).json({ message: 'userId and hospitalId are required' });
        }
        const updatedFavouriteDoc = await Favourite.findOneAndUpdate(
            { userId: userId },
            pipeline,
            {
                upsert: true,
                new: true
            }
        );
        res.status(200).json({ message: `Favourite status updated`, })
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: 'Internal server error' });
    }

}
