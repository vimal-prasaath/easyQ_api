

export const updateObjectPayload=(data)=>{
const allowedUpdates = [
        'name',
        'email',
        'phoneNumber',
        'hospitalType',
        'imageUrl',
        'ambulanceNumber',
        'location',
        'address'
    ];
    try{
    const updateData = {};
    return  constructObject(updateData,allowedUpdates,data)
    }catch(e){
      console.log(e)
    }

}

const constructObject=(updateData,allowedUpdates,data)=>{
   
  for (const key of Object.keys(data)) {
     if (allowedUpdates.includes(key)) {
          updateData[key] = data[key];
          if(key === 'address' || key === 'location' ){
              constructObject(updateData,allowedUpdates,data[key]) 
            }   
     }
  }
  return updateData
}

export const updateFacilityPayload=(data)=>{
    try{

    const allowedUpdates = [
        'facilities',
        'labs',
        'departments'
    ];

    const updateData = {};
    for (const key of Object.keys(data)) {
        if (allowedUpdates.includes(key)) {
            updateData[key] = data[key];
        }
    }
    return updateData
    }catch(e){
   console.log(e)
    }
}

export const updateComment=async(data,hospitalId)=>{
  const { rating, comment } = data;
  try{
       if ((comment === undefined || comment === null || (typeof comment === 'string' && comment.trim().length === 0)) && rating === undefined) {
       throw new Error(" comment is required")    
    }
     const updateFields = {};
    if (comment !== undefined) {
        updateFields.comment = comment;
    }
    const averageRating = await updateReview(updateFields,rating,hospitalId)
    return {updateFields,averageRating}       
  }catch(e){
  console.log(e)
  }
}

export const  updateReview=async (updateFields,rating)=>{
    try{
     if (rating !== undefined) {
        updateFields.rating = rating;
    }
    let newAverageRating = 0;
      const result = await Reviews.aggregate([
                        { $match: { hospitalId: hospitalId } },
                        {
                            $group: {
                                _id: '$hospitalId',
                                averageRating: { $avg: '$rating' }
                            }
                        }
                    ]);

    if (result.length > 0) {
        newAverageRating = parseFloat(result[0].averageRating.toFixed(1));
    }
    return newAverageRating

    }catch(e){

    }
}