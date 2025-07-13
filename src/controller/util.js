export const constructPipeLine = (updates) => {
   let pipeline = [];
    let setFields = { updatedAt: new Date() };

    let newStatus = updates.status;
    let changedBy = updates.changedByUserId;

    for (const key in updates) {
        if (updates.hasOwnProperty(key) && key !== 'status' && key !== 'changedByUserId' && key !== 'appointmentId') {
            setFields[key] = updates[key];
        }
    }

    pipeline.push({
        $set: setFields
    });

    if (newStatus && typeof newStatus === 'string') {
        const allowedStatuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Canceled', 'Rescheduled', 'No-Show'];
        if (!allowedStatuses.includes(newStatus)) {
           
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid status value: '${newStatus}'. Allowed values are: ${allowedStatuses.join(', ')}.`
            );
        }

        pipeline.push({
            $set: {
                status: newStatus,
                statusHistory: {
                    $concatArrays: [
                        { $ifNull: ["$statusHistory", []] },
                        [{
                            status: newStatus,
                            timestamp: new Date(),
                            changedBy: changedBy ? changedBy : null
                        }]
                    ]
                }
            }
        });
    }

    return pipeline;
};