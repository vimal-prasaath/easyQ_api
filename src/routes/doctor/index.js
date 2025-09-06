import { createDoctor, getDoctor, deleteDoctor, getAllDoctor, updateDoctor, uploadDoctorImage, getAvailableTimeSlots } from "../../controller/doctor.js";
import express from "express";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
import authorizeRoles from "../../middleware/authorization.js";
import authenticateAdmin from "../../middleware/adminAuth.js";
import adminVerificationCheck from "../../middleware/adminVerificationCheck.js";
import { uploadMiddleware, busboyErrorHandler } from "../../config/fileConfig.js";
const router = express.Router();

router.post("/add", authenticateAdmin, adminVerificationCheck, createDoctor)
router.post("/get", authorizeOwnerOrAdmin, getDoctor)
router.put("/update", authorizeRoles, updateDoctor)
router.delete("/delete", authenticateAdmin, adminVerificationCheck, deleteDoctor)
router.get("/all/:hospitalId",authorizeOwnerOrAdmin, getAllDoctor)
router.put('/upload-image',
    authenticateAdmin,
    adminVerificationCheck,
    uploadMiddleware,
    busboyErrorHandler,
    uploadDoctorImage
);

// New route for updating doctor profile image URL (frontend handles upload)
router.put('/update-image-url', authenticateAdmin, updateDoctorImageUrl);

// New route for getting available time slots
router.post('/available-time-slots', getAvailableTimeSlots);

export default router;