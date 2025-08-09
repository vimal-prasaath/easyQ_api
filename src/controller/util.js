export const constructPipeLine = (updates = {}) => {
    let pipeline = [];

    // If no updates are provided, return a default pipeline for fetching all appointments, sorted by date and time
    if (Object.keys(updates).length === 0) {
        pipeline.push({ $sort: { appointmentDate: 1, appointmentTime: 1 } });
        return pipeline;
    }

    // --- Original logic for building update pipelines when 'updates' are provided ---
    // let setFields = { updatedAt: new Date() };

    // let newStatus = updates.status;
    // let changedBy = updates.changedByUserId;

    // for (const key in updates) {
    //     if (updates.hasOwnProperty(key) && key !== 'status' && key !== 'changedByUserId' && key !== 'appointmentId') {
    //         setFields[key] = updates[key];
    //     }
    // }

    // pipeline.push({
    //     $set: setFields
    // });

    // if (newStatus && typeof newStatus === 'string') {
    //     const allowedStatuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Canceled', 'Rescheduled', 'No-Show'];
    //     if (!allowedStatuses.includes(newStatus)) {
    //         throw new EasyQError(
    //             'ValidationError',
    //             httpStatusCode.BAD_REQUEST,
    //             true,
    //             `Invalid status value: '${newStatus}'. Allowed values are: ${allowedStatuses.join(', ')}.`
    //         );
    //     }

    //     pipeline.push({
    //         $set: {
    //             status: newStatus,
    //             statusHistory: {
    //                 $concatArrays: [
    //                     { $ifNull: ["$statusHistory", []] },
    //                     [{
    //                         status: newStatus,
    //                         timestamp: new Date(),
    //                         changedBy: changedBy ? changedBy : null
    //                     }]
    //                 ]
    //             }
    //         }
    //     });
    // }

    // return pipeline;
};


export const getAppointmentByIdPipe = (patientId) => {
    return [
        {
            $match: { patientId }
        },
        {
            $lookup: {
                from: 'doctors',
                localField: 'doctorId',
                foreignField: 'doctorId',
                as: 'doctorInfo'
            }
        },
        { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'hospitals',
                localField: 'hospitalId',
                foreignField: 'hospitalId',
                as: 'hospitalInfo'
            }
        },
        { $unwind: { path: '$hospitalInfo', preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                doctorName: '$doctorInfo.name',
                doctorImage: '$doctorInfo.profileImageUrl',
                doctorSpecialization: '$doctorInfo.specialization',
                hospitalAddress: '$hospitalInfo.address',
                hospitalImage: '$hospitalInfo.imageUrl',
                hospitalName: '$hospitalInfo.name'
            }
        },
        {
            $project: {
                doctorInfo: 0,
                hospitalInfo: 0
            }
        }
    ];
};


export const getAppointmentByAppointmentIdPipe = (appointmentId) => {
    return [
        {
            $match: { appointmentId }
        },
        {
            $lookup: {
                from: 'doctors',
                localField: 'doctorId',
                foreignField: 'doctorId',
                as: 'doctorInfo'
            }
        },
        { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'hospitals',
                localField: 'hospitalId',
                foreignField: 'hospitalId',
                as: 'hospitalInfo'
            }
        },
        { $unwind: { path: '$hospitalInfo', preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                doctorName: '$doctorInfo.name',
                doctorImage: '$doctorInfo.profileImageUrl',
                doctorSpecialization: '$doctorInfo.specialization',
                hospitalAddress: '$hospitalInfo.address',
                hospitalImage: '$hospitalInfo.imageUrl',
                hospitalName: '$hospitalInfo.name'
            }
        },
        {
            $project: {
                doctorInfo: 0,
                hospitalInfo: 0
            }
        }
    ];
};
