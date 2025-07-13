import express from 'express';
import { uploadFile, getFiles, deleteFile , downloadFile } from "../../controller/uploadFile.js";
import {uploadMiddleware} from '../../config/fileConfig.js';

const router = express.Router();

router.post('/', uploadMiddleware.single('file'), uploadFile);

router.get('/', getFiles);

router.get('/download', downloadFile);

router.delete('/', deleteFile);

export default router;