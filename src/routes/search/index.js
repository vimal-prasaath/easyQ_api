import express from "express";
import { searchHospital } from "../../controller/searchController.js";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
import authorizeRoles from "../../middleware/authorization.js";
const router = express.Router();

router.post("/", authorizeOwnerOrAdmin, searchHospital);

export default router;
