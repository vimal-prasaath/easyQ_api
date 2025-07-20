
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    fileType: {
        type: String, 
        required: true
    },
    fileKey:{
        type: String,
        required: false
    },
    fileUrl: {
        type: String,
        required: false
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const hospitalDocumentsSchema = new mongoose.Schema({
    hospitalId: {
        type: String, 
        ref: 'Hospital'
    },
    documents: [documentSchema] 
});

const userHospitalFilesSchema = new mongoose.Schema({
    userId: {
        type: String, 
        ref: 'User',
        required: true,
        unique: true 
    },
    hospitals: [hospitalDocumentsSchema] 
});

const UserHospitalFiles = mongoose.model('UserHospitalFiles', userHospitalFilesSchema);

export default UserHospitalFiles;