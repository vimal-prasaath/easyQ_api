
import QRCode from 'qrcode'

export const generateQR=async(dataToEncodeObject)=>{
     try{
        const { userId, appointmentId } = dataToEncodeObject;
        let baseUrl=process.env.BASE_FRONTEND_URL
        console.log(baseUrl)
        const url = new URL(baseUrl);
        url.searchParams.append('userId', userId);
        url.searchParams.append('appointmentId', appointmentId);
        const qrContentUrl = url.toString()

     const qrCodeDataUrl = QRCode.toDataURL(qrContentUrl, {
                type: 'image/png',
                errorCorrectionLevel: 'H',
                width: 250, 
                margin: 1 
            });
            return qrCodeDataUrl
     }catch(e){
      console.log(e)
     }
}

