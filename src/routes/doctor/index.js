import { createDoctor , getDoctor ,deleteDoctor, getAllDoctor , updateDoctor} from "../../controller/doctor.js";
import express from "express";
const router=express.Router()

router.post("/add",createDoctor)

router.get("/:doctorId",getDoctor)

router.get("/all/:hospitalId",getAllDoctor)

router.put("/:doctorId",updateDoctor)
router.delete("/:doctorId",deleteDoctor)

export default router