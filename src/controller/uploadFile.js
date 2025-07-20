import UserHospitalFiles from "../model/file.js";
import { encryptBufferForge, decryptBufferForge } from '../util/fileCrypto.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { uploadFileToFirebase, getPresignedUrlForDownload, deleteFileFromFirebase } from '../config/fireBaseStorage.js';

export async function uploadFile(req, res, next) {
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

        let fileStorageInfo;
        let storedIn = 'Firebase Storage'; 

        try {
            // Upload file to Firebase Storage
            fileStorageInfo = await uploadFileToFirebase(file.buffer, file.originalname, file.mimetype, userId);
        } catch (storageError) {
            console.error('Firebase Storage upload failed:', storageError.message);
            return next(new EasyQError(
                'UploadError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to upload file to Firebase Storage: ${storageError.message}`
            ));
        }

        const newDocument = {
            fileName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            fileType: fileType,
            uploadedAt: new Date(),
            fileUrl: fileStorageInfo.url, 
            fileKey: fileStorageInfo.path, 
        };

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
            message: 'File uploaded successfully to Firebase Storage and database entry created.',
            document: {
                fileName: newDocument.fileName,
                mimeType: newDocument.mimeType,
                size: newDocument.size,
                fileType: newDocument.fileType,
                fileUrl: newDocument.fileUrl,
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
                    fileUrl: doc.fileUrl ,
                    storedLocation: doc.fileUrl ,
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
                        fileUrl: doc.fileUrl ,
                        storedLocation: doc.fileUrl ,
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

        // Delete from Firebase Storage if fileKey exists
        if (documentToDelete.fileKey) {
            try {
                await deleteFileFromFirebase(documentToDelete.fileKey);
            } catch (firebaseDeleteError) {
                console.error(`Failed to delete file from Firebase Storage: ${firebaseDeleteError.message}`);
            }
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

        // Only proceed if fileKey exists, indicating it's stored in Firebase Storage
        if (document.fileKey) {
            try {
                const presignedUrl = await getPresignedUrlForDownload(document.fileKey);
                return res.status(httpStatusCode.OK).json({ downloadUrl: presignedUrl, message: 'Presigned URL generated for Firebase Storage download.' });
            } catch (firebasePresignError) {
                return next(new EasyQError(
                    'FirebaseError',
                    httpStatusCode.INTERNAL_SERVER_ERROR,
                    false,
                    `Error generating secure download link for Firebase Storage file: ${firebasePresignError.message}`
                ));
            }
        } else {
            // If fileKey is not present, it means the file is not in Firebase Storage
            // and we are explicitly not supporting database-stored files for download here.
            return next(new EasyQError(
                'FileContentError',
                httpStatusCode.NOT_FOUND,
                true,
                'File content not available for this document via Firebase Storage.'
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
