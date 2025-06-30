import  {generateQR} from "../util/qrGemnerator.js"
import Appointment from '../model/appointment.js'
import User from '../model/userProfile.js'
export async function qrGeneator(req, res) {
    console.log(req.body)
    const { userId, appointmentId } = req.body
    try {
        const patientData= await User.findOne({userId:userId})
         const appointment=await Appointment.findOne({appointmentId:appointmentId})
        if(!appointment) return
        if(!patientData) return
    
        let dataToEncodeObject={userId:patientData.userId,appointmentId:appointment.appointmentId}
        const qrCodeDataUrl = await generateQR(dataToEncodeObject);
         await Appointment.findOneAndUpdate(
            { appointmentId: appointmentId }, 
            { qrCodeDataUrl: qrCodeDataUrl }
            )
         
        res.status(200).json({
            message: 'QR code generated and attached to appointment successfully.',
            qrCode: qrCodeDataUrl
        })

    } catch (e) {
        console.log(e)
    }
}

export async function getQRCode(req,res){
        const {userId,appointmentId}=req.query;
        console.log(userId,appointmentId,req.parms)
        try{
            const userData= await User.findOne({userId:userId})
            const appointmentData= await Appointment.findOne({appointmentId:appointmentId})
            res.status(200).json({
                message:"deatils Fetch Succesfully",
                user:userData,
                appointmentDetails:appointmentData
            })
        }catch(e){
                console.log(e)
        }
}