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