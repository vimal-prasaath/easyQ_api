import { EasyQError } from '../config/error.js'; 
import { httpStatusCode } from '../util/statusCode.js'; 

export const favpipline = (hospitalId, favourite) => {
    // Input validation
    if (!hospitalId || typeof hospitalId !== 'string') {
        throw new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'Invalid hospitalId provided for favourite pipeline. It must be a string.'
        );
    }

    if (typeof favourite !== 'boolean') {
        throw new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'Invalid favourite status provided for favourite pipeline. It must be a boolean (true/false).'
        );
    }

    let pipeline = [
        {
            $set: {
                favouriteHospitals: {
                    $cond: {
                        if: { $eq: [favourite, true] },
                        then: {
                            $cond: {
                                if: { $in: [hospitalId, { $ifNull: ["$favouriteHospitals.hospitalId", []] }] },
                                then: {
                                    $map: {
                                        input: { $ifNull: ["$favouriteHospitals", []] },
                                        as: "favHospital",
                                        in: {
                                            $cond: {
                                                if: { $eq: ["$$favHospital.hospitalId", hospitalId] },
                                                then: { hospitalId: "$$favHospital.hospitalId", isFavourite: true },
                                                else: "$$favHospital"
                                            }
                                        }
                                    }
                                },
                                else: {
                                    $concatArrays: [
                                        { $ifNull: ["$favouriteHospitals", []] },
                                        [{ hospitalId: hospitalId, isFavourite: true }]
                                    ]
                                }
                            }
                        },
                        else: {
                            $filter: {
                                input: { $ifNull: ["$favouriteHospitals", []] },
                                as: "favHospital",
                                cond: { $ne: ["$$favHospital.hospitalId", hospitalId] }
                            }
                        }
                    }
                }
            }
        }
    ];
    return pipeline;
};