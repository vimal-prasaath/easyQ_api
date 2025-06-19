
import Hospital from "../../model/hospital/index.js"
import HsptlFacilities from "../../model/hospital/facility.js"
import Reviews from "../../model/hospital/review.js"
import {updateObjectPayload,updateFacilityPayload,updateComment} from './update_controller.js'
export async function createHospital(req,res) {
    const data=req.body
    try{
      const hospital= await Hospital.create(data)
      res.status(200).json({message: "Hospita Data is Created SuccussFully"})
    }catch(e){
     console.log(e) 
    }
    
}
export async function hospitalFacility(req,res){
  const data=req.body
   try{
     const hsptl = await Hospital.findOne({hospitalId:data["hospitalId"]})
      if(!hsptl){
        res.status(400).json({message:"HospitalId is not found"})
        return
      }
     const facilities=await HsptlFacilities.create(data)
      res.status(200).json({message: "Data is Saved SuccussFully"})
   
   }catch(e){
     console.log(e) 
   }
}
export async function createReviews(req,res) {
  const data=req.body
  try{
      const hsptl = await Hospital.findOne({hospitalId:data["hospitalId"]})
      if(!hsptl){
        res.status(400).json({message:"HospitalId is not found"})
        return
      }
   const reviews=await Reviews.create(data)
    res.status(200).json({message: "Data is Saved SuccussFully"})
  }catch(e){
     console.log(e) 
  }
  
}

export const updateHospitalBasicDetails = async (req, res) => {
    const { hospitalId } = req.params;
    
    const updateData= updateObjectPayload(req.body)
    try {
        const updatedHospital = await Hospital.findOneAndUpdate(
            { hospitalId: hospitalId },
            { $set: updateData },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!updatedHospital) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }

        res.status(200).json({
            message: 'Hospital basic details updated successfully',
            hospital: updatedHospital
        });

    } catch (error) {
        console.error('Error updating hospital basic details:', error);
       }
    };

export async function updateFacility(req,res) {
    const { hospitalId } = req.params;
      const updateData=updateFacilityPayload(req.body)

    try {
        const updatedDetails = await HsptlFacilities.findOneAndUpdate(
            { hospitalId: hospitalId },
            { $set: updateData },
            {
                new: true,
                runValidators: true,
                upsert: true,
                context: 'query'
            }
        );

        if (updatedDetails.isNew) {
            const hospitalExists = await Hospital.findOne({ hospitalId: hospitalId });
            if (!hospitalExists) {
                 console.warn(`HospitalDetails document created for non-existent HospitalId: ${hospitalId}`);
            }
        }

        res.status(200).json({
            message: 'Hospital facilities and details updated successfully',
            details: updatedDetails
        });

    } catch (error) {
        console.error('Error updating hospital facilities/details:', error);
      }
}

export async function updateReviewComment(req, res) {
    const { hospitalId } = req.params;
    const {updateFields,averageRating}=await updateComment(req.body,hospitalId)
    try {
        const hospitalExists = await Hospital.findOne({ hospitalId: hospitalId });
        if (!hospitalExists) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }

        const updatedReview = await Reviews.findOneAndUpdate(
            {
                hospitalId: hospitalId
            },
            {
                $set: updateFields
            },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!updatedReview) {
            return res.status(404).json({ message: 'Review not found for this hospital.' });
        }
            
         await Hospital.updateOne(
                { hospitalId: hospitalId },
                { $set: { averageRating: averageRating } }
            );
        res.status(200).json({
            message: 'Review updated successfully',
            review: updatedReview
        });

    } catch (error) {
        console.error('Error updating review:', error);
     }
}


export async function getAllHospitalDetails(req, res) {
    try {
        const allHospitals = await Hospital.find({}); // Find all documents in the Hospital collection

        res.status(200).json({
            message: 'Successfully retrieved all hospital basic details',
            count: allHospitals.length,
            hospitals: allHospitals
        });

    } catch (error) {
        console.error('Error fetching all hospital basic details:', error);
    }
}


export async function getHospitalDetails(req,res) {
    const {hospitalId}=req.params
     try {
        const allHospitals = await Hospital.findOne({hospitalId:hospitalId}); 
        const facilities = await getHsptlFacilities(hospitalId)
        const review = await getHsptlReviews(hospitalId)
        res.status(200).json({
            message: 'Successfully retrieved all hospital basic details',
            count: allHospitals.length,
            hospitals: allHospitals,
            facilities: facilities,
            review : review
        });

    } catch (error) {
        console.error('Error fetching all hospital basic details:', error);
           }
    
}

export async function getHsptlFacilities(hospitalId) {
   
     try {
        const allHospitals = await HsptlFacilities.findOne({hospitalId:hospitalId}); 
         return allHospitals

    } catch (error) {
        console.error('Error fetching all hospital facilities details:', error);
           }
}

export async function getHsptlReviews(hospitalId) {

     try {
        const reviews = await Reviews.findOne({hospitalId:hospitalId}); 
        return reviews
        

    } catch (error) {
        console.error('Error fetching all hospital Revies details:', error);
           }
}

export async function deleteHsptl(req, res) {
    const { hospitalId } = req.params;

    try {
        const deletedHospital = await Hospital.findOneAndDelete({ hospitalId: hospitalId });

        if (!deletedHospital) {
            return res.status(404).json({ message: 'Hospital not found.' });
        }

        const deletedDetailsResult = await Hospital.deleteOne({ hospitalId: hospitalId });

        const deletedReviewsResult = await Reviews.deleteOne({ hospitalId: hospitalId });

        res.status(200).json({
            message: `Hospital "${deletedHospital.name}" (ID: ${hospitalId}) and its associated data deleted successfully.`,
            deletedHospital: {
                hospitalId: deletedHospital.hospitalId,
                name: deletedHospital.name
            },
            deletedDetailsCount: deletedDetailsResult.deletedCount,
            deletedReviewsCount: deletedReviewsResult.deletedCount
        });

    } catch (error) {
        console.error('Error deleting hospital and associated data:', error);
            }
}






