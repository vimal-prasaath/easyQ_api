import Busboy from 'busboy';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { Readable } from 'stream';

// Busboy middleware for Firebase Functions (recommended by Firebase)
export const uploadMiddleware = (req, res, next) => {
    // Check if this is a multipart request
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
        return next(new EasyQError(
            'ValidationError',
            httpStatusCode.BAD_REQUEST,
            true,
            'Content-Type must be multipart/form-data'
        ));
    }

    const busboy = Busboy({ 
        headers: req.headers,
        limits: {
            fileSize: 2 * 1024 * 1024, // 2MB limit
            files: 1, // Only one file
            fields: 5 // Maximum 5 fields
        }
    });

    const fields = {};
    let file = null;
    let hasError = false;

    // Handle file uploads
    busboy.on('file', (fieldname, stream, fileInfo) => {
        console.log('Processing file:', fieldname, fileInfo.filename);
        
        // Validate file type and fix MIME type for octet-stream
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/octet-stream'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
        
        // Get file extension
        const fileExtension = fileInfo.filename.toLowerCase().substring(fileInfo.filename.lastIndexOf('.'));
        
        // If MIME type is octet-stream, try to detect proper MIME type from extension
        if (fileInfo.mimeType === 'application/octet-stream') {
            if (allowedExtensions.includes(fileExtension)) {
                // Map extension to proper MIME type
                const mimeTypeMap = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.pdf': 'application/pdf'
                };
                fileInfo.mimeType = mimeTypeMap[fileExtension];
                console.log(`Fixed MIME type from octet-stream to: ${fileInfo.mimeType} for file: ${fileInfo.filename}`);
            } else {
                hasError = true;
                return next(new EasyQError(
                    'ValidationError',
                    httpStatusCode.UNSUPPORTED_MEDIA_TYPE,
                    true,
                    'Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed.'
                ));
            }
        }
        
        // Final validation with corrected MIME type
        if (!allowedTypes.includes(fileInfo.mimeType)) {
            hasError = true;
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.UNSUPPORTED_MEDIA_TYPE,
                true,
                'Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed.'
            ));
        }

        // Collect file data
        const chunks = [];
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            file = {
                fieldname: fieldname,
                originalname: fileInfo.filename,
                encoding: '7bit',
                mimetype: fileInfo.mimeType,
                size: buffer.length,
                buffer: buffer
            };
        });

        stream.on('error', (err) => {
            console.error('File stream error:', err);
            hasError = true;
            return next(new EasyQError(
                'FileUploadError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                'File upload stream error'
            ));
        });
    });

    // Handle form fields
    busboy.on('field', (fieldname, value) => {
        console.log('Processing field:', fieldname, value);
        fields[fieldname] = value;
    });

    // Handle completion
    busboy.on('finish', () => {
        if (hasError) return;
        
        console.log('Busboy processing completed');
        
        // Set request data
        req.body = fields;
        req.file = file;
        
        next();
    });

    // Handle errors
    busboy.on('error', (err) => {
        console.error('Busboy error:', err);
        return next(new EasyQError(
            'FileUploadError',
            httpStatusCode.BAD_REQUEST,
            true,
            `File upload error: ${err.message}`
        ));
    });

    // Handle limit errors
    busboy.on('limit', () => {
        return next(new EasyQError(
            'FileUploadError',
            httpStatusCode.PAYLOAD_TOO_LARGE,
            true,
            'File size or field limit exceeded'
        ));
    });

    // Parse the request
    if (req.rawBody) {
        // Firebase Functions with rawBody
        busboy.end(req.rawBody);
    } else {
        // Regular Express app
        req.pipe(busboy);
    }
};

// Error handler for Busboy
export const busboyErrorHandler = (err, req, res, next) => {
    console.log('=== BUSBOY ERROR HANDLER ===');
    console.log('Error caught:', err);
    console.log('Error type:', err.constructor.name);
    console.log('Error message:', err.message);
    console.log('=====================================');
    
    if (err instanceof EasyQError) {
        return next(err);
    }
    
    return next(new EasyQError(
        'FileUploadError',
        httpStatusCode.INTERNAL_SERVER_ERROR,
        false,
        `File upload error: ${err.message}`
    ));
};