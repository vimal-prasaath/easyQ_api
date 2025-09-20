import { createNurse, getNurse, deleteNurse, getAllNurse, updateNurse, uploadNurseImage, updateNurseImageUrl } from "../../controller/nurse.js";
import express from "express";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
import authorizeRoles from "../../middleware/authorization.js";
import authenticateAdmin from "../../middleware/adminAuth.js";
import adminVerificationCheck from "../../middleware/adminVerificationCheck.js";
import { uploadMiddleware, busboyErrorHandler } from "../../config/fileConfig.js";

const router = express.Router();

router.post("/add", authenticateAdmin, adminVerificationCheck, createNurse)
router.post("/get", authorizeOwnerOrAdmin, getNurse)
router.put("/update", authorizeRoles, updateNurse)
router.delete("/delete", authenticateAdmin, adminVerificationCheck, deleteNurse)
router.get("/all/:hospitalId", authorizeOwnerOrAdmin, getAllNurse)
router.put('/upload-image',
    authenticateAdmin,
    adminVerificationCheck,
    uploadMiddleware,
    busboyErrorHandler,
    uploadNurseImage
);

// New route for updating nurse profile image URL (frontend handles upload)
router.put('/update-image-url', authenticateAdmin, updateNurseImageUrl);

export default router;
