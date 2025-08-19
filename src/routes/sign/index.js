// src/routes/sign/index.js
import express from "express";
import { signUp } from "../../controller/signup.js"; // Assuming controller path is correct

const router = express.Router();

router.post('/', signUp); // This endpoint will be accessed at /api/signup due to app.use in app.js

export default router;