import AWS from 'aws-sdk';
import path from 'path';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

export const uploadFileToS3 = async (fileBuffer, originalname, mimetype, userId) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(originalname)}`;
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: uniqueName,
        Body: fileBuffer,
        ContentType: mimetype,
        ACL: 'private',
        Metadata: {
            fieldName: 'file',
            userId: userId || 'unknown'
        },
        ServerSideEncryption: 'AES256'

    };

    try {
        const data = await s3.upload(params).promise();
        return {url:data.Location , key:data.Key}
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
};

export const getPresignedUrlForDownload = (fileKey, expiresInSeconds = 300) => { 
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
        Expires: expiresInSeconds
    };
    return s3.getSignedUrl('getObject', params);
}