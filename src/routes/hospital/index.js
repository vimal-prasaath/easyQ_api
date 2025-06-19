import express from 'express'
import { createHospital ,getHospitalDetails,updateFacility,
    updateReviewComment, hospitalFacility, createReviews , 
    deleteHsptl ,getAllHospitalDetails , updateHospitalBasicDetails} from '../../controller/hopital_controller/hospital.js'

const router=express.Router()
//create 
router.post('/basicDetails',createHospital)
router.post('/facilities',hospitalFacility)
router.post('/review',createReviews)
//Delete
router.delete('/:hospitalId',deleteHsptl)
//Read
router.get('/:hospitalId',getHospitalDetails)
router.get('/',getAllHospitalDetails)

//update
router.put('/details/:hospitalId',updateHospitalBasicDetails)
router.put('/facilities/:hospitalId',updateFacility)
router.put('/review/:hospitalId',updateReviewComment)

export default router
