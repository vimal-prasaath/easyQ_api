import Hospital from "../model/hospital/index.js";
import { buildSearchPipeline, constructLastquery, lastqueryUpdate } from "../util/searchUtil.js";
import SearchSuggestion from "../model/search.js";
export async function searchHospital(req, res) {

    try {
        const searchParams = req.body;
        const userId = req.body.userId;
        let lastSearch = ""
        console.log(userId)
        if (!userId) {
            return
        }

        const lastquery = await constructLastquery(searchParams)
        const existing = await SearchSuggestion.findOne({ userId: userId });
        if (existing && existing?.lastquery?.length !== 0) {
             lastSearch = await SearchSuggestion.findOneAndUpdate(
                { userId: userId },
                {
                    $set: {
                        lastquery: lastquery, 
                    }
                },
                {
                    upsert: true,
                    new: true
                }
            );
        
        }
        else {
            await SearchSuggestion.create({
                userId,
                lastquery: lastquery
            });
        }
        const pipeline = buildSearchPipeline(searchParams);
        const searchData = await Hospital.aggregate(pipeline)
        res.status(200).json({ data: searchData,lastSearch:lastSearch?.lastquery })
    } catch (e) {
        console.log(e)
    }
}

