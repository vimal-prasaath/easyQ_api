import Doctor from "../model/doctor.js";
import Hospital from "../model/hospital/index.js"
export async function createDoctor(req,res) {
    const data=req.body
    try{
        if (!data.hospitalId) {
            return res.status(400).json({ message: 'Hospital ID is mandatory to create a doctor.' });
        }
        const hospitalExists = await Hospital.findOne({hospitalId:data.hospitalId});
        if (!hospitalExists) {
            return res.status(404).json({ message: `Hospital with ID ${data.hospitalId} not found. Cannot create doctor.` });
        }
     const doctor=await Doctor.create(data)
     res.status(200).json({message:"Data is created Succussfully"})
    }catch(e){
        console.log(e)
    }
    
}

export async function getDoctor(req,res) {
    const {doctorId}=req.params
    console.log(doctorId)
    try{
     const doctorData=await Doctor.find({doctorId:doctorId})
     res.status(200).json({message:"Doctor Data is fecthed Succesfully",doctor:doctorData})
    }catch(e){
    console.log(e)
    }
    
}


export async function deleteDoctor(req,res) {
    const {doctorId}=req.params
    try{
    const data=await Doctor.findOneAndDelete({doctorId:doctorId})
    res.status(200).json({message:"Deleted Succesfully"})
    }catch(e){
        console.log(e)
    }
    
}


export async function updateDoctor(req, res) {
    const { doctorId } = req.params;
    const updates = req.body;

    try {
        const updatedDoctor = await Doctor.findOneAndUpdate(
            { doctorId: doctorId },
            { $set: updates },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!updatedDoctor) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        res.status(200).json({
            message: 'Doctor information updated successfully',
            doctor: updatedDoctor
        });

    } catch (error) {
        console.error('Error updating doctor:', error);
           }
}



export async function getAllDoctor(req, res) {
    const { hospitalId } = req.params;

    try {
        const doctorsData = await Doctor.find({ hospitalId: hospitalId });

        if (doctorsData.length === 0) {
            return res.status(200).json({
                message: `No doctors found for hospital ID: ${hospitalId}`,
                doctors: []
            });
        }

        res.status(200).json({
            message: "Doctor data fetched successfully",
            count: doctorsData.length,
            doctors: doctorsData,
            hospitalId:hospitalId
        });

    } catch (error) {
        console.error('Error fetching doctor data:', error);
     }
}