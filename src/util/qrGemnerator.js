
import QRCode from 'qrcode'
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
export const generateQR=async(dataToEncodeObject)=>{
     try {
        const { userId, appointmentId } = dataToEncodeObject;

        if (!userId || !appointmentId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Missing userId or appointmentId for QR code generation.'
            );
        }

        const baseUrl = process.env.BASE_FRONTEND_URL;

        if (!baseUrl) {
            throw new EasyQError(
                'ConfigurationError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                'BASE_FRONTEND_URL is not configured in environment variables.'
            );
        }

        const url = new URL(baseUrl);
        url.searchParams.append('userId', userId);
        url.searchParams.append('appointmentId', appointmentId);
        const qrContentUrl = url.toString();

        const qrCodeDataUrl = await QRCode.toDataURL(qrContentUrl, {
            type: 'image/png',
            errorCorrectionLevel: 'H',
            width: 250,
            margin: 1
        });
        return qrCodeDataUrl;
    } catch (error) {
        if (error instanceof EasyQError) {
            throw error;
        }
        throw new EasyQError(
            'QRCodeGenerationError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error generating QR code: ${error.message}`
        );
    }
}
