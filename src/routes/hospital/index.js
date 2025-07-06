import express from 'express'
import {
    createHospital, getHospitalDetails, updateFacility,
    updateReviewComment, hospitalFacility, createReviews,
    deleteHsptl, getAllHospitalDetails, updateHospitalBasicDetails, getHospitalDetailsBylocation
} from '../../controller/hopital_controller/hospital.js'

const router = express.Router()

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
router.post('/basicDetails', createHospital)

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
router.post('/facilities', hospitalFacility)

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
router.post('/review', createReviews)

/**
 * @swagger
 * /api/hospital/{hospitalId}:
 *   get:
 *     summary: Get hospital details by ID
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
 *         description: Hospital details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hospital'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hospital not found
 * 
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
router.delete('/:hospitalId', deleteHsptl)
router.get('/:userId/:hospitalId', getHospitalDetails)


router.get('/location', getHospitalDetailsBylocation);
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
router.get('/', getAllHospitalDetails)

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
router.put('/details/:hospitalId', updateHospitalBasicDetails)

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
router.put('/facilities/:hospitalId', updateFacility)

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
router.put('/review/:hospitalId', updateReviewComment)

export default router
