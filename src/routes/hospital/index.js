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

/**
 * @swagger
 * /api/hospital/basicDetails:
 *   post:
 *     summary: Create a new hospital
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hospital'
 *     responses:
 *       201:
 *         description: Hospital created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/basicDetails", authorizeRoles, createHospital);

/**
 * @swagger
 * /api/hospital/facilities:
 *   post:
 *     summary: Add hospital facilities
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/HospitalFacility'
 *     responses:
 *       201:
 *         description: Facilities added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/facilities", authorizeRoles, hospitalFacility);

/**
 * @swagger
 * /api/hospital/review:
 *   post:
 *     summary: Create a hospital review
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HospitalReview'
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post("/review", authorizeOwnerOrAdmin, createReviews);

/**
 * @swagger
 * /api/hospital/{hospitalId}:
 *   delete:
 *     summary: Delete a hospital
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hospital deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hospital not found
 */
router.delete("/:hospitalId", authorizeRoles, deleteHsptl);

/**
 * @swagger
 * /api/hospital/{userId}/{hospitalId}:
 *   get:
 *     summary: Get hospital details by ID for a specific user
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user requesting hospital details
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the hospital to retrieve
 *     responses:
 *       200:
 *         description: Hospital details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hospital'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hospital not found
 */
router.get("/:userId/:hospitalId", authorizeOwnerOrAdmin, getHospitalDetails);

/**
 * @swagger
 * /api/hospital/location:
 *   get:
 *     summary: Get hospitals by location
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HospitalLocationSearch'
 *     responses:
 *       200:
 *         description: List of hospitals near the specified location
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hospital'
 *       400:
 *         description: Invalid location parameters
 *       401:
 *         description: Unauthorized
 */
router.post("/location", authorizeOwnerOrAdmin, getHospitalDetailsBylocation);

/**
 * @swagger
 * /api/hospital:
 *   get:
 *     summary: Get all hospitals
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all hospitals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hospital'
 *       401:
 *         description: Unauthorized
 */
router.get("/", authorizeOwnerOrAdmin, getAllHospitalDetails);

/**
 * @swagger
 * /api/hospital/details/{hospitalId}:
 *   put:
 *     summary: Update hospital basic details
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Hospital'
 *     responses:
 *       200:
 *         description: Hospital details updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hospital not found
 */
router.put(
  "/details/:hospitalId",
  authorizeOwnerOrAdmin,
  updateHospitalBasicDetails
);

/**
 * @swagger
 * /api/hospital/facilities/{hospitalId}:
 *   put:
 *     summary: Update hospital facilities
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Facilities updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hospital not found
 */
router.put("/facilities/:hospitalId", authorizeRoles, updateFacility);

/**
 * @swagger
 * /api/hospital/review/{hospitalId}:
 *   put:
 *     summary: Update hospital review
 *     tags: [Hospitals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hospital or review not found
 */
router.put("/review/:hospitalId", authorizeOwnerOrAdmin, updateReviewComment);

export default router;
