import SearchSuggestion from "../model/search.js";
export const buildSearchPipeline = (parms) => {
    try {
        const pipeline = [];
        const matchCondition = {};

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
                hospitalId: 1,
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

    } catch (e) {
        console.error("Error constructing search pipeline:", e);
        throw e;
    }
};
export const constructLastquery=async(searchParams)=>{
        try{
        const lastquery = []; 
        for (const key in searchParams) {
            if (Object.prototype.hasOwnProperty.call(searchParams, key)) {
                const value = searchParams[key];

                if (typeof value === 'string') {
                    const trimmedValue = value.trim();
                    if (trimmedValue !== '' && key !== 'userId') {
                        lastquery.push(trimmedValue);
                    }
                }
                else if (Array.isArray(value)) {
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
        console.log(lastquery)
        return lastquery
        }catch(e){
          console.log(e)
        }
}


export const lastqueryUpdate=async(userId,searchQueryString)=>{
    try{
 await SearchSuggestion.findOneAndUpdate(
                    { userId: userId },
                    [ 
                        {
                            $set: {
                                lastquery: {
                                    $filter: {
                                        input: "$lastquery",
                                        as: "item",
                                        cond: { $ne: ["$$item", searchQueryString] }
                                    }
                                }
                            }
                        },
                        {
                            $set: {
                                lastquery: {
                                    $concatArrays: [[searchQueryString], "$lastquery"]
                                }
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
                        new: true
                    }
                );
    }catch(e){
    console.log(e)
    }
}