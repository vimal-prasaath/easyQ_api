import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';

// Replace with your Firebase service account key path or object
// Make sure this file is not publicly accessible!
const serviceAccount = require('/path/to/your/serviceAccountKey.json'); 

initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET_NAME // e.g., "your-project-id.appspot.com"
});

const bucket = getStorage().bucket();

export const uploadFileToFirebase = async (fileBuffer, originalname, mimetype, userId) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(originalname)}`;
    const file = bucket.file(uniqueName);

    try {
        await file.save(fileBuffer, {
            contentType: mimetype,
            metadata: {
                metadata: { // Firebase stores custom metadata under a 'metadata' key
                    fieldName: 'file',
                    userId: userId || 'unknown'
                }
            }
        });
        
        // Make the file publicly readable for direct URL access (optional, adjust as needed)
        // If you want private files, you'll rely solely on presigned URLs for download.
        await file.makePublic(); 

        const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET_NAME}/${uniqueName}`;
        return { url: publicUrl, key: uniqueName }; // 'key' here refers to the file path in Firebase Storage
    } catch (error) {
        console.error("Error uploading to Firebase Storage:", error);
        throw error;
    }
};

export const getPresignedUrlForDownload = async (fileKey, expiresInSeconds = 300) => {
    const file = bucket.file(fileKey);

    try {
        // expiresInSeconds is converted to milliseconds for Firebase
        const expirationDate = new Date(Date.now() + expiresInSeconds * 1000); 
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: expirationDate
        });
        return url;
    } catch (error) {
        console.error("Error generating presigned URL for Firebase Storage:", error);
        throw error;
    }
};