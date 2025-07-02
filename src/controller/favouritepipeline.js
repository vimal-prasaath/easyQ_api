export const favpipline = (hospitalId, favourite) => {
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
}