import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const bucket = getStorage().bucket();

export const uploadFileToFirebase = async (fileBuffer, originalname, mimetype, userId) => {
    const sanitizedUserId = userId ? userId.replace(/[^a-zA-Z0-9-_.]/g, '_') : 'unknown';
    const fileExtension = path.extname(originalname);
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    const filePathInStorage = `uploads/users/${sanitizedUserId}/${uniqueFileName}`;
    const file = bucket.file(filePathInStorage);

    try {
        await file.save(fileBuffer, {
            contentType: mimetype,
            metadata: {
                metadata: {
                    fieldName: 'file',
                    userId: userId || 'unknown',
                    originalName: originalname
                }
            }
        });
        
        await file.makePublic(); 

        const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET_NAME}/${filePathInStorage}`;
        
        return { url: publicUrl, path: filePathInStorage };
    } catch (error) {
        console.error("Error uploading to Firebase Storage:", error);
        throw error;
    }
};

export const getPresignedUrlForDownload = async (filePath, expiresInSeconds = 300) => {
    const file = bucket.file(filePath);

    try {
        const expirationDate = new Date(Date.now() + expiresInSeconds * 1000);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: expirationDate
        });
        console.log("Generated presigned URL for Firebase Storage:", url);
        return url;
    } catch (error) {
        console.error("Error generating presigned URL for Firebase Storage:", error);
        throw error;
    }
};

export const deleteFileFromFirebase = async (filePath) => {
    const storageRef = bucket.file(filePath);
    try {
        await storageRef.delete();
        console.log("File deleted from Firebase Storage:", filePath);
    } catch (error) {
        console.error("Error deleting file from Firebase Storage:", error);
        throw error;
    }
};
