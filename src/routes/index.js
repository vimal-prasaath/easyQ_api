import express from 'express';
import authenticate from '../middleware/auth.js';
import { setupProtectedRoutes } from '../config/routerProtected.js';
import protectedRoutesConfig from '../config/protectedRouterConfig.js';

const router = express.Router();
const policyProtectedRouter = express.Router();
setupProtectedRoutes(policyProtectedRouter, protectedRoutesConfig);

router.use('/',authenticate, policyProtectedRouter);

export default router;

