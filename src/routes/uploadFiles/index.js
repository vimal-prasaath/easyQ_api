import express from 'express';
import { uploadFile, getFiles, deleteFile , downloadFile } from "../../controller/uploadFile.js";
import {uploadMiddleware, busboyErrorHandler} from '../../config/fileConfig.js';
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";

const router = express.Router();

router.post('/', uploadMiddleware, busboyErrorHandler, authorizeOwnerOrAdmin, uploadFile);

router.get('/', authorizeOwnerOrAdmin,getFiles);

router.get('/download',authorizeOwnerOrAdmin, downloadFile);

router.delete('/',authorizeOwnerOrAdmin, deleteFile);

export default router;