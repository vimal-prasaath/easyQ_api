
import PatientNotes from "../model/patientNotes.js";
import Doctor from "../model/doctor.js";
import { EasyQError } from '../config/error.js'; 
import { httpStatusCode } from '../util/statusCode.js';
import { ResponseFormatter } from '../util/responseFormatter.js';
import { ValidationErrorHandler } from '../util/errorHandler.js';

// Create a new patient note
export async function createPatientNote(req, res, next) {
    const data = req.body;
    try {
        if (!data.doctorId || !data.patientId || !data.notes || !data.visitType) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID, Patient ID, notes, and visit type are required.'
            ));
        }

        // Verify doctor exists
        const doctorExists = await Doctor.findOne({ doctorId: data.doctorId });
        if (!doctorExists) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Doctor with ID ${data.doctorId} not found.`
            ));
        }

        const patientNote = await PatientNotes.create(data);
        
        const response = ResponseFormatter.formatSuccessResponse({
            message: "Patient note created successfully",
            data: {
                patientNote: patientNote,
                noteId: patientNote.noteId
            },
            statusCode: httpStatusCode.CREATED
        });
        
        res.status(httpStatusCode.CREATED).json(response);
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'createPatientNote', next);
    }
}

// Get patient notes by doctor ID
export async function getPatientNotesByDoctor(req, res, next) {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, patientId } = req.query;

    try {
        if (!doctorId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Doctor ID is required.'
            ));
        }

        const filter = { doctorId };
        if (patientId) filter.patientId = patientId;

        const skip = (page - 1) * limit;
        const patientNotes = await PatientNotes.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select(ResponseFormatter.getSelectFields());

        const total = await PatientNotes.countDocuments(filter);
        const meta = ResponseFormatter.formatPaginationMeta(page, limit, total);

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Patient notes retrieved successfully",
            data: {
                patientNotes: patientNotes,
                doctorId: doctorId
            },
            meta: meta,
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'getPatientNotesByDoctor', next);
    }
}

// Get patient notes by patient ID
export async function getPatientNotesByPatient(req, res, next) {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        if (!patientId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Patient ID is required.'
            ));
        }

        const skip = (page - 1) * limit;
        const patientNotes = await PatientNotes.find({ patientId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select(ResponseFormatter.getSelectFields());

        const total = await PatientNotes.countDocuments({ patientId });
        const meta = ResponseFormatter.formatPaginationMeta(page, limit, total);

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Patient notes retrieved successfully",
            data: {
                patientNotes: patientNotes,
                patientId: patientId
            },
            meta: meta,
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'getPatientNotesByPatient', next);
    }
}

// Update patient note
export async function updatePatientNote(req, res, next) {
    const { noteId } = req.params;
    const updates = req.body;

    try {
        if (!noteId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Note ID is required for update.'
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

        const updatedNote = await PatientNotes.findOneAndUpdate(
            { noteId: noteId },
            { $set: updates },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        ).select(ResponseFormatter.getSelectFields());

        if (!updatedNote) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Patient note not found.'
            ));
        }

        const response = ResponseFormatter.formatSuccessResponse({
            message: 'Patient note updated successfully',
            data: {
                patientNote: updatedNote
            },
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);

    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'updatePatientNote', next);
    }
}

// Delete patient note
export async function deletePatientNote(req, res, next) {
    const { noteId } = req.params;

    try {
        if (!noteId) {
            return next(new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Note ID is required.'
            ));
        }

        const deletedNote = await PatientNotes.findOneAndDelete({ noteId: noteId }).select(ResponseFormatter.getSelectFields());
        if (!deletedNote) {
            return next(new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'Patient note not found.'
            ));
        }

        const response = ResponseFormatter.formatSuccessResponse({
            message: "Patient note deleted successfully",
            data: {
                deletedNote: deletedNote
            },
            statusCode: httpStatusCode.OK
        });
        
        res.status(httpStatusCode.OK).json(response);
    } catch (error) {
        ValidationErrorHandler.handleAllErrors(error, 'deletePatientNote', next);
    }
}

