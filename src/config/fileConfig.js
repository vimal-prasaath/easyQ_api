import multer from 'multer';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

export const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let message = 'File upload failed.';
        let statusCode = httpStatusCode.BAD_REQUEST;
        let isOperational = true;

        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File is too large. Maximum allowed size is 5MB.';
                statusCode = httpStatusCode.PAYLOAD_TOO_LARGE;
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files uploaded.';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = `Unexpected field '${err.field}' in file upload.`;
                break;
            case 'LIMIT_PART_COUNT':
                message = 'Too many parts in the multipart form.';
                break;
            case 'LIMIT_FIELD_KEY':
                message = 'Field name too long.';
                break;
            case 'LIMIT_FIELD_VALUE':
                message = 'Field value too long.';
                break;
            case 'LIMIT_FIELD_COUNT':
                message = 'Too many fields in the form.';
                break;
            default:
                message = `Multer error: ${err.message}`;
                isOperational = false;
                break;
        }
        return next(new EasyQError('MulterError', statusCode, isOperational, message));
    } else if (err) {
        if (err.message === 'Invalid file type. Only JPEG, PNG, and PDF are allowed.') {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.UNSUPPORTED_MEDIA_TYPE,
                true,
                err.message
            ));
        }
        return next(new EasyQError(
            'FileUploadError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `An unexpected error occurred during file upload: ${err.message}`
        ));
    }
    next();
};