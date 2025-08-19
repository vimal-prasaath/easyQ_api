import express from "express";
import {
  createHospital,
  getHospitalDetails,
  updateFacility,
  updateReviewComment,
  hospitalFacility,
  createReviews,
  deleteHsptl,
  getAllHospitalDetails,
  updateHospitalBasicDetails,
  getHospitalDetailsBylocation,
} from "../../controller/hospital.js";
import authorizeRoles from "../../middleware/authorization.js";
import authorizeOwnerOrAdmin from "../../middleware/adminOwnerOrAdmin.js";
const router = express.Router();

router.post("/basicDetails", authorizeRoles, createHospital);
router.post("/facilities", authorizeRoles, hospitalFacility);
router.post("/review", authorizeOwnerOrAdmin, createReviews);
router.delete("/:hospitalId", authorizeRoles, deleteHsptl);
router.get("/:userId/:hospitalId", authorizeOwnerOrAdmin, getHospitalDetails);
router.post("/location", authorizeOwnerOrAdmin, getHospitalDetailsBylocation);
router.get("/", authorizeOwnerOrAdmin, getAllHospitalDetails);
router.put(
  "/details/:hospitalId",
  authorizeOwnerOrAdmin,
  updateHospitalBasicDetails
);
router.put("/facilities/:hospitalId", authorizeRoles, updateFacility);
router.put("/review/:hospitalId", authorizeOwnerOrAdmin, updateReviewComment);

export default router;
