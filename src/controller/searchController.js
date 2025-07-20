import Hospital from "../model/hospital.js";
import { buildSearchPipeline, constructLastquery, lastqueryUpdate } from "../util/searchUtil.js";
import SearchSuggestion from "../model/search.js";
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
export async function searchHospital(req, res , next) {

   try {
        const searchParams = req.body;
        const userId = req.body.userId;

        if (!userId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID is required for search tracking.'
            ));
        }

        const lastquery = await constructLastquery(searchParams);
        let lastSearchDoc = null;

        const existing = await SearchSuggestion.findOne({ userId: userId });

        if (existing && existing?.lastquery?.length !== 0) {
            lastSearchDoc = await SearchSuggestion.findOneAndUpdate(
                { userId: userId },
                { $set: { lastquery: lastquery } },
                { upsert: true, new: true, runValidators: true }
            );
        } else {
            lastSearchDoc = await SearchSuggestion.create({
                userId,
                lastquery: lastquery
            });
        }

        const pipeline = buildSearchPipeline(searchParams);
        const searchData = await Hospital.aggregate(pipeline);

        res.status(httpStatusCode.OK).json({ data: searchData, lastSearch: lastSearchDoc?.lastquery });

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
            `Failed to search hospitals or update search history: ${error.message}`
        ));
    }
}

