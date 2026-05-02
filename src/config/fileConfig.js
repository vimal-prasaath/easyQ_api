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
            // Align with doctor/nurse image validation (5MB); iPhone HEIC often 2–5MB
            fileSize: 5 * 1024 * 1024,
            files: 1, // Only one file
            fields: 10 // adminId, doctorId, file + multipart overhead
        }
    });

    const fields = {};
    let file = null;
    let hasError = false;

    // Handle file uploads
    busboy.on('file', (fieldname, stream, fileInfo) => {
        console.log('Processing file:', fieldname, fileInfo.filename);
        
        // Validate file type and fix MIME type for octet-stream
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/heic',
            'image/heif',
            'application/pdf',
            'application/octet-stream'
        ];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.heic', '.heif'];
        
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
                    '.pdf': 'application/pdf',
                    '.heic': 'image/heic',
                    '.heif': 'image/heif'
                };
                fileInfo.mimeType = mimeTypeMap[fileExtension];
                console.log(`Fixed MIME type from octet-stream to: ${fileInfo.mimeType} for file: ${fileInfo.filename}`);
            } else {
                hasError = true;
                return next(new EasyQError(
                    'ValidationError',
                    httpStatusCode.UNSUPPORTED_MEDIA_TYPE,
                    true,
                    'Invalid file type. Only JPEG, JPG, PNG, HEIC, HEIF, and PDF files are allowed.'
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
                'Invalid file type. Only JPEG, JPG, PNG, HEIC, HEIF, and PDF files are allowed.'
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

// Busboy middleware for multiple file uploads (for appointment documents)
export const uploadMultipleFilesMiddleware = (req, res, next) => {
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
            fileSize: 10 * 1024 * 1024, // 10MB limit per file
            files: 10, // Maximum 10 files
            fields: 5 // Maximum 5 fields
        }
    });

    const fields = {};
    const files = [];
    let hasError = false;
    let filesProcessed = 0;
    let totalFiles = 0;
    let isProcessing = false;

    // Handle file uploads
    busboy.on('file', (fieldname, stream, fileInfo) => {
        if (!isProcessing) {
            isProcessing = true;
        }
        totalFiles++;
        console.log('Processing file:', fieldname, fileInfo.filename);
        
        // Validate file type and fix MIME type for octet-stream
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'application/octet-stream'
        ];
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
        
        // Get file extension
        const fileExtension = fileInfo.filename.toLowerCase().substring(fileInfo.filename.lastIndexOf('.'));
        
        // If MIME type is octet-stream, try to detect proper MIME type from extension
        if (fileInfo.mimeType === 'application/octet-stream') {
            if (allowedExtensions.includes(fileExtension)) {
                // Map extension to proper MIME type
                const mimeTypeMap = {
                    '.pdf': 'application/pdf',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.doc': 'application/msword',
                    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    '.xls': 'application/vnd.ms-excel',
                    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    '.txt': 'text/plain'
                };
                fileInfo.mimeType = mimeTypeMap[fileExtension];
                console.log(`Fixed MIME type from octet-stream to: ${fileInfo.mimeType} for file: ${fileInfo.filename}`);
            } else {
                hasError = true;
                return next(new EasyQError(
                    'ValidationError',
                    httpStatusCode.UNSUPPORTED_MEDIA_TYPE,
                    true,
                    'Invalid file type. Only PDF, images, Word docs, Excel files, and text files are allowed.'
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
                'Invalid file type. Only PDF, images, Word docs, Excel files, and text files are allowed.'
            ));
        }

        // Collect file data
        const chunks = [];
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            files.push({
                fieldname: fieldname,
                originalname: fileInfo.filename,
                encoding: '7bit',
                mimetype: fileInfo.mimeType,
                size: buffer.length,
                buffer: buffer
            });
            filesProcessed++;
            
            console.log(`File processed: ${filesProcessed}/${totalFiles}`);
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
        console.log(`Total files processed: ${filesProcessed}/${totalFiles}`);
        
        // Set request data
        req.body = fields;
        req.files = files;
        
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