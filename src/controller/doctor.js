import Doctor from "../model/doctor.js";
import Hospital from "../model/hospital/index.js"
import { EasyQError } from '../config/error.js'; 
import { httpStatusCode } from '../util/statusCode.js';
export async function createDoctor(req,res , next) {
   const data = req.body;
    try {
        if (!data.hospitalId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is mandatory to create a doctor.'
            ));
        }
        if (!data.name || !data.specialization || !data.contactNumber) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor name, specialization, and contact number are required.'
            ));
        }

        const hospitalExists = await Hospital.findOne({ hospitalId: data.hospitalId }); 
        if (!hospitalExists) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Hospital with ID ${data.hospitalId} not found. Cannot create doctor.`
            ));
        }

        const doctor = await Doctor.create(data);
        res.status(httpStatusCode.CREATED).json({ message: "Doctor data created successfully", doctorId: doctor._id }); // Use 201 for creation
    } catch (error) {
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Hospital ID format: ${data.hospitalId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to create doctor: ${error.message}`
        ));
    }
    
}

export async function getDoctor(req,res , next) {
    const { doctorId } = req.params;
    try {
        if (!doctorId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required.'
            ));
        }
        const doctorData = await Doctor.find({ doctorId: doctorId }); 
        if (!doctorData || doctorData.length === 0) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Doctor not found.'
            ));
        }
        res.status(httpStatusCode.OK).json({ message: "Doctor data fetched successfully", doctor: doctorData[0] }); // Return single doctor
    } catch (error) {
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Doctor ID format: ${doctorId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to fetch doctor data: ${error.message}`
        ));
    }
    
}


export async function deleteDoctor(req,res , next) {
    const { doctorId } = req.params;
    try {
        if (!doctorId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required.'
            ));
        }
        const data = await Doctor.findOneAndDelete({ doctorId: doctorId }); 
        if (!data) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Doctor not found.'
            ));
        }
        res.status(httpStatusCode.OK).json({ message: "Doctor deleted successfully" });
    } catch (error) {
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Doctor ID format: ${doctorId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Failed to delete doctor: ${error.message}`
        ));
    }
    
}


export async function updateDoctor(req, res , next) {
     const { doctorId } = req.params;
    const updates = req.body;

    try {
        if (!doctorId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required for update.'
            ));
        }
        if (Object.keys(updates).length === 0) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'No update fields provided.'
            ));
        }

        const updatedDoctor = await Doctor.findOneAndUpdate(
            { doctorId: doctorId }, 
            { $set: updates },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!updatedDoctor) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Doctor not found.'
            ));
        }

        res.status(httpStatusCode.OK).json({
            message: 'Doctor information updated successfully',
            doctor: updatedDoctor
        });

    } catch (error) {
        if (error.name === 'ValidationError' && error.errors) {
            const messages = Object.values(error.errors).map(val => val.message);
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                messages.join('; ')
            ));
        }
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Doctor ID format: ${doctorId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error updating doctor: ${error.message}`
        ));
    }
}



export async function getAllDoctor(req, res , next) {
     const { hospitalId } = req.params;

    try {
        if (!hospitalId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Hospital ID is required to fetch doctors.'
            ));
        }

        const doctorsData = await Doctor.find({ hospitalId: hospitalId });

        res.status(httpStatusCode.OK).json({
            message: "Doctor data fetched successfully",
            count: doctorsData.length,
            doctors: doctorsData,
            hospitalId: hospitalId
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return next(new EasyQError(
                'InvalidInputError',
                httpStatusCode.BAD_REQUEST,
                true,
                `Invalid Hospital ID format: ${hospitalId}`
            ));
        }
        next(new EasyQError(
            'DatabaseError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            false,
            `Error fetching doctor data: ${error.message}`
        ));
    }
}