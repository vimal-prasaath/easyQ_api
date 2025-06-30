import mongoose from 'mongoose';

const fileUploadSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
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
  fileUrl: {
    type: String,
    required: true
  },
  fileBuffer: {
    type: Buffer, 
    required: false 
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);

export default FileUpload;
