import express from "express"
import { postfavourite, getfavourite} from '../../controller/favourite.js'
 
const router=express.Router()

router.post('/addfav',postfavourite)
router.get('/:userId/:hospitalId',getfavourite)

export default router
