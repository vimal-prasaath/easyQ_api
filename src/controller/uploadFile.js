import UserHospitalFiles from "../model/file.js";
import { uploadFileToS3 , getPresignedUrlForDownload } from '../config/awsS3.js';
import { encryptBufferForge, decryptBufferForge } from '../util/fileCrypto.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

export async function uploadFile(req, res ,next) {
  try {
        const { userId, hospitalId, fileType } = req.body;
        const file = req.file;

        if (!userId || !hospitalId || !fileType) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Missing required fields: userId, hospitalId, or fileType.'
            ));
        }

        if (!file) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'No file uploaded or file type/size not allowed.'
            ));
        }

        let fileS3Info = '';
        let storedIn = 'S3';
        let s3UploadAttempted = false;

        try {
            s3UploadAttempted = true;
            fileS3Info = await uploadFileToS3(file.buffer, file.originalname, file.mimetype, userId);
        } catch (s3Error) {
            console.warn('S3 upload failed, attempting fallback to direct DB storage.', s3Error.message);
            storedIn = 'Database';
            if (file.size > (16 * 1024 * 1024)) { // MongoDB document size limit
                return next(new EasyQError(
                    'FileSizeExceeded',
                    httpStatusCode.PAYLOAD_TOO_LARGE,
                    true,
                    'File too large to store in database (exceeds 16MB limit) after S3 fallback failed.'
                ));
            }
        }

        const newDocument = {
            fileName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            fileType: fileType,
            uploadedAt: new Date()
        };

        if (storedIn === 'Database') {
            try {
                const { iv, encryptedData } = encryptBufferForge(file.buffer);
                newDocument.fileBuffer = encryptedData;
                newDocument.iv = iv;
                newDocument.fileUrl = '';
            } catch (encryptionError) {
                return next(new EasyQError(
                    'EncryptionError',
                    httpStatusCode.INTERNAL_SERVER_ERROR,
                    false,
                    `Failed to encrypt file for database storage: ${encryptionError.message}`
                ));
            }
        } else {
            newDocument.fileUrl = fileS3Info.url;
            newDocument.fileKey = fileS3Info.key;
            newDocument.fileBuffer = undefined;
            newDocument.iv = undefined;
        }

        let userFiles = await UserHospitalFiles.findOne({ userId });

        if (!userFiles) {
            userFiles = new UserHospitalFiles({
                userId,
                hospitals: []
            });
        }

        let hospitalEntry = userFiles.hospitals.find(h => h.hospitalId.toString() === hospitalId);

        if (hospitalEntry) {
            hospitalEntry.documents.push(newDocument);
        } else {
            userFiles.hospitals.push({
                hospitalId,
                documents: [newDocument]
            });
        }

        await userFiles.save();

        res.status(httpStatusCode.CREATED).json({
            message: storedIn === 'Database'
                ? 'File uploaded to DB (encrypted) due to S3 unavailability.'
                : 'File uploaded successfully to S3 and database entry created.',
            document: {
                fileName: newDocument.fileName,
                mimeType: newDocument.mimeType,
                size: newDocument.size,
                fileType: newDocument.fileType,
                fileUrl: newDocument.fileUrl || 'Stored in DB (encrypted)',
                storedLocation: storedIn
            }
        });

    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid ID format provided.`
            ));
        }
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Server error during file upload: ${error.message}`
        ));
    }
}

export async function getFiles(req, res , next) {
  try {
        const { userId, hospitalId } = req.body;

        if (!userId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID is required to fetch files.'
            ));
        }

        const userFiles = await UserHospitalFiles.findOne({userId: userId });

        if (!userFiles) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'No files found for this user.'
            ));
        }

        let filesToReturn = [];
        if (hospitalId) {
            const hospitalEntry = userFiles.hospitals.find(h => h.hospitalId.toString() === hospitalId);
            if (hospitalEntry) {
                filesToReturn = hospitalEntry.documents.map(doc => ({
                    _id: doc._id,
                    fileName: doc.fileName,
                    mimeType: doc.mimeType,
                    size: doc.size,
                    fileType: doc.fileType,
                    uploadedAt: doc.uploadedAt,
                    fileUrl: doc.fileUrl || (doc.fileBuffer ? 'Stored in DB (encrypted)' : 'N/A'),
                    storedLocation: doc.fileUrl ? 'S3' : (doc.fileBuffer ? 'Database' : 'Unknown'),
                    documentId: doc._id
                }));
            } else {
                return next(new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'No files found for this hospital under the specified user.'
                ));
            }
        } else {
            userFiles.hospitals.forEach(hosp => {
                hosp.documents.forEach(doc => {
                    filesToReturn.push({
                        _id: doc._id,
                        fileName: doc.fileName,
                        mimeType: doc.mimeType,
                        size: doc.size,
                        fileType: doc.fileType,
                        uploadedAt: doc.uploadedAt,
                        fileUrl: doc.fileUrl || (doc.fileBuffer ? 'Stored in DB (encrypted)' : 'N/A'),
                        storedLocation: doc.fileUrl ? 'S3' : (doc.fileBuffer ? 'Database' : 'Unknown'),
                        hospitalId: hosp.hospitalId,
                        documentId: doc._id
                    });
                });
            });
        }

        res.status(httpStatusCode.OK).json({ files: filesToReturn });

    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid ID format provided.`
            ));
        }
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Server error fetching files: ${error.message}`
        ));
    }
}


export async function getAllUserFiles(req, res,next) {
    try {
        const { userId } = req.query;

        if (!userId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'User ID is required to fetch all files.'
            ));
        }

        const userFiles = await UserHospitalFiles.findOne({ userId });

        if (!userFiles) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'No files found for this user across any hospital.'
            ));
        }

        let filesToReturn = [];
        userFiles.hospitals.forEach(hosp => {
            filesToReturn = filesToReturn.concat(hosp.documents.map(doc => ({
                _id: doc._id,
                fileName: doc.fileName,
                mimeType: doc.mimeType,
                size: doc.size,
                fileType: doc.fileType,
                uploadedAt: doc.uploadedAt,
                fileUrl: doc.fileUrl || (doc.fileBuffer ? 'Stored in DB (encrypted)' : 'N/A'),
                storedLocation: doc.fileUrl ? 'S3' : (doc.fileBuffer ? 'Database' : 'Unknown'),
                hospitalId: hosp.hospitalId,
                documentId: doc._id
            })));
        });

        res.status(httpStatusCode.OK).json({ files: filesToReturn });

    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid User ID format provided.`
            ));
        }
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Server error fetching all user files: ${error.message}`
        ));
    }
}

export async function deleteFile(req, res ,next) {
    try {
        const { userId, hospitalId, documentId } = req.body;

        if (!userId || !hospitalId || !documentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Missing required fields: userId, hospitalId, or documentId.'
            ));
        }

        const userFiles = await UserHospitalFiles.findOne({ userId });

        if (!userFiles) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'User file record not found.'
            ));
        }

        const hospitalEntry = userFiles.hospitals.find(h => h.hospitalId.toString() === hospitalId);

        if (!hospitalEntry) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Hospital entry not found for this user.'
            ));
        }

        const initialDocCount = hospitalEntry.documents.length;
        const documentToDelete = hospitalEntry.documents.find(doc => doc._id.toString() === documentId);

        if (!documentToDelete) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Document not found within the specified hospital.'
            ));
        }

        hospitalEntry.documents = hospitalEntry.documents.filter(
            doc => doc._id.toString() !== documentId
        );

        if (hospitalEntry.documents.length === 0) {
            userFiles.hospitals = userFiles.hospitals.filter(h => h.hospitalId.toString() !== hospitalId);
        }

       
        await userFiles.save();

        res.status(httpStatusCode.OK).json({ message: 'Document deleted successfully.' });

    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid ID format provided.`
            ));
        }
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Server error deleting file: ${error.message}`
        ));
    }
}


export async function downloadFile(req, res ,next) {
  try {
        const { userId, hospitalId, documentId } = req.body;

        if (!userId || !hospitalId || !documentId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Missing required fields: userId, hospitalId, or documentId.'
            ));
        }

        const userFiles = await UserHospitalFiles.findOne({ userId });
        if (!userFiles) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'User file record not found.'
            ));
        }

        const hospitalEntry = userFiles.hospitals.find(h => h.hospitalId.toString() === hospitalId);
        if (!hospitalEntry) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Hospital entry not found for this user.'
            ));
        }

        const document = hospitalEntry.documents.find(doc => doc._id.toString() === documentId);
        if (!document) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Document not found.'
            ));
        }

        if (document.fileKey) {
            try {
                const presignedUrl = getPresignedUrlForDownload(document.fileKey);
                return res.status(httpStatusCode.OK).json({ downloadUrl: presignedUrl, message: 'Presigned URL generated for S3 download.' });
            } catch (s3PresignError) {
                return next(new EasyQError(
                    'S3Error',
                    httpStatusCode.INTERNAL_SERVER_ERROR,
                    false,
                    `Error generating secure download link for S3 file: ${s3PresignError.message}`
                ));
            }
        } else if (document.fileBuffer && document.iv) {
            try {
                const decryptedBuffer = decryptBufferForge(document.fileBuffer, document.iv);

                res.set({
                    'Content-Type': document.mimeType,
                    'Content-Length': decryptedBuffer.length,
                    'Content-Disposition': `attachment; filename="${document.fileName}"`
                });
                return res.status(httpStatusCode.OK).send(decryptedBuffer); 
            } catch (decryptionError) {
                return next(new EasyQError(
                    'DecryptionError',
                    httpStatusCode.INTERNAL_SERVER_ERROR,
                    false,
                    `Error decrypting file from DB for download: ${decryptionError.message}`
                ));
            }
        } else {
            return next(new EasyQError(
                'FileContentError',
                httpStatusCode.NOT_FOUND,
                true,
                'File content not available for this document (neither S3 key nor DB buffer found).'
            ));
        }

    } catch (error) {
        if (error instanceof EasyQError) {
            return next(error);
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid ID format provided.`
            ));
        }
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Server error during file download: ${error.message}`
        ));
    }
}