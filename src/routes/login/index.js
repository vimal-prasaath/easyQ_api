// src/routes/login/index.js
import express from "express";
import { login } from "../../controller/login.js"; // Assuming controller path is correct
import { resetUserPassword } from "../../controller/user.js"; // Assuming controller path is correct
import authenticate from "../../middleware/auth.js";
const router = express.Router();

router.post('/', authenticate,login); // This endpoint will be accessed at /api/login due to app.use in app.js
router.post('/resetPassword', resetUserPassword); // This endpoint will be accessed at /api/user/resetPassword due to app.use in app.js

export default router;