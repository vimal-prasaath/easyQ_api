import express from 'express';
import {
    adminSignup,
    adminLogin,
    updateOnboardingInfo,
    updateHospitalDocuments,
    updateOwnerDocuments,
    getAdminDetails,
    getAdminDashboard,
    getTodayStats,
    updateOwnerInfo,
    updateHospitalBasicInfo,
    updateHospitalCompleteInfo,
    deleteAdmin,
    activateUser
} from '../../controller/admin.js';
import authenticateAdmin from '../../middleware/adminAuth.js';
import { uploadMiddleware, multerErrorHandler } from '../../config/fileConfig.js';

const router = express.Router();

router.post('/signup', adminSignup);

router.post('/login', adminLogin);

// Public route - no authentication required
router.put('/user/activate/:userId', activateUser);

router.put('/onboarding', authenticateAdmin, updateOnboardingInfo);

router.put('/hospital-documents',
    authenticateAdmin,
    uploadMiddleware.single('file'),
    multerErrorHandler,
    updateHospitalDocuments
);

router.put('/owner-documents',
    authenticateAdmin,
    uploadMiddleware.single('file'),
    multerErrorHandler,
    updateOwnerDocuments
);

router.get('/:adminId', authenticateAdmin, getAdminDetails);

router.post('/dashboard', authenticateAdmin, getAdminDashboard);

router.post('/today-stats', authenticateAdmin, getTodayStats);

router.put('/owner-info', authenticateAdmin, updateOwnerInfo);

router.put('/hospital/basic-info', authenticateAdmin, updateHospitalBasicInfo);

router.put('/hospital/complete-info', authenticateAdmin, updateHospitalCompleteInfo);

router.delete('/:adminId', authenticateAdmin, deleteAdmin);

export default router;
