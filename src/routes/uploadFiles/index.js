/**
 * @swagger
 * /api/uploadfile:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or upload error
 *
 * /api/getfile:
 *   post:
 *     summary: Get all files for a user
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of files
 *       404:
 *         description: No files found
 *
 * /api/file/download:
 *   post:
 *     summary: Download a file
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: File download link
 *       404:
 *         description: File not found
 *
 * /api/file/delete:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: File deleted
 *       404:
 *         description: File not found
 */
import express from 'express';
import { uploadFile, getFiles, deleteFile , downloadFile } from "../../controller/uploadFile.js";
import {uploadMiddleware} from '../../config/fileConfig.js';
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";

const router = express.Router();

router.post('/', uploadMiddleware.single('file'),authorizeOwnerOrAdmin, uploadFile);

router.get('/', authorizeOwnerOrAdmin,getFiles);

router.get('/download',authorizeOwnerOrAdmin, downloadFile);

router.delete('/',authorizeOwnerOrAdmin, deleteFile);

export default router;