import PatientNotes from '../model/patientNotes.js';
import Doctor from '../model/doctor.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { CentralValidator } from '../middleware/validation/centralValidator.js';

export class PatientNotesService {
    
    static async createPatientNote(noteData) {
        try {
            const doctorExists = await Doctor.findOne({ doctorId: noteData.doctorId });
            if (!doctorExists) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Doctor with ID ${noteData.doctorId} not found.`
                );
            }

            if (noteData.notes) {
                noteData.notes = CentralValidator.sanitizeText(noteData.notes);
            }

            if (noteData.diagnosis) {
                noteData.diagnosis = CentralValidator.sanitizeText(noteData.diagnosis);
            }

            if (noteData.symptoms) {
                noteData.symptoms = CentralValidator.sanitizeText(noteData.symptoms);
            }

            if (noteData.treatmentPlan) {
                noteData.treatmentPlan = CentralValidator.sanitizeText(noteData.treatmentPlan);
            }

            if (noteData.prescription && Array.isArray(noteData.prescription)) {
                CentralValidator.validatePrescription(noteData.prescription);
            }

            if (noteData.vitalSigns) {
                CentralValidator.validateVitalSigns(noteData.vitalSigns);
            }

            const patientNote = await PatientNotes.create(noteData);
            
            return {
                patientNote: patientNote,
                noteId: patientNote.noteId
            };
        } catch (error) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            throw error;
        }
    }

    static async getPatientNotesByDoctor(doctorId, options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                patientId, 
                visitType, 
                dateFrom, 
                dateTo,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options;

            const filter = { doctorId };
            
            if (patientId) {
                filter.patientId = patientId;
            }
            
            if (visitType) {
                filter.visitType = visitType;
            }

            if (dateFrom || dateTo) {
                filter.createdAt = {};
                if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) filter.createdAt.$lte = new Date(dateTo);
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const skip = (page - 1) * limit;
            const patientNotes = await PatientNotes.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await PatientNotes.countDocuments(filter);

            const visitTypeStats = await PatientNotes.aggregate([
                { $match: { doctorId } },
                { $group: { _id: '$visitType', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            return {
                patientNotes: patientNotes,
                doctorId: doctorId,
                statistics: {
                    visitTypeDistribution: visitTypeStats.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    totalNotes: total
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                },
                filters: {
                    patientId: patientId || null,
                    visitType: visitType || null,
                    dateFrom: dateFrom || null,
                    dateTo: dateTo || null,
                    sortBy,
                    sortOrder
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch patient notes: ${error.message}`
            );
        }
    }

    static async getPatientNotesByPatient(patientId, options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                doctorId,
                visitType,
                dateFrom,
                dateTo,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = options;

            const filter = { patientId };
            
            if (doctorId) {
                filter.doctorId = doctorId;
            }
            
            if (visitType) {
                filter.visitType = visitType;
            }

            if (dateFrom || dateTo) {
                filter.createdAt = {};
                if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) filter.createdAt.$lte = new Date(dateTo);
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const skip = (page - 1) * limit;
            const patientNotes = await PatientNotes.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await PatientNotes.countDocuments(filter);

            const timelineStats = await PatientNotes.aggregate([
                { $match: { patientId } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 },
                        visitTypes: { $push: '$visitType' }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 }
            ]);

            return {
                patientNotes: patientNotes,
                patientId: patientId,
                medicalTimeline: timelineStats.map(item => ({
                    period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                    visitCount: item.count,
                    visitTypes: [...new Set(item.visitTypes)]
                })),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                },
                filters: {
                    doctorId: doctorId || null,
                    visitType: visitType || null,
                    dateFrom: dateFrom || null,
                    dateTo: dateTo || null,
                    sortBy,
                    sortOrder
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch patient notes: ${error.message}`
            );
        }
    }

    static async updatePatientNote(noteId, updates) {
        try {
            if (Object.keys(updates).length === 0) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'No update fields provided.'
                );
            }

            if (updates.notes) {
                updates.notes = CentralValidator.sanitizeText(updates.notes);
            }

            if (updates.diagnosis) {
                updates.diagnosis = CentralValidator.sanitizeText(updates.diagnosis);
            }

            if (updates.symptoms) {
                updates.symptoms = CentralValidator.sanitizeText(updates.symptoms);
            }

            if (updates.treatmentPlan) {
                updates.treatmentPlan = CentralValidator.sanitizeText(updates.treatmentPlan);
            }

            if (updates.prescription && Array.isArray(updates.prescription)) {
                CentralValidator.validatePrescription(updates.prescription);
            }

            if (updates.vitalSigns) {
                CentralValidator.validateVitalSigns(updates.vitalSigns);
            }

            const updatedNote = await PatientNotes.findOneAndUpdate(
                { noteId: noteId },
                { $set: updates },
                {
                    new: true,
                    runValidators: true,
                    context: 'query'
                }
            ).select('-_id -__v');

            if (!updatedNote) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Patient note not found.'
                );
            }

            return updatedNote;
        } catch (error) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    messages.join('; ')
                );
            }
            throw error;
        }
    }

    static async deletePatientNote(noteId) {
        try {
            const deletedNote = await PatientNotes.findOneAndDelete({ noteId: noteId }).select('-_id -__v');
            if (!deletedNote) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Patient note not found.'
                );
            }
            return deletedNote;
        } catch (error) {
            throw error;
        }
    }

    static async getPatientMedicalHistory(patientId, options = {}) {
        try {
            const { 
                includePrescriptions = true,
                includeVitalSigns = true,
                dateFrom,
                dateTo,
                groupByDoctor = false
            } = options;

            const filter = { patientId };
            
            if (dateFrom || dateTo) {
                filter.createdAt = {};
                if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) filter.createdAt.$lte = new Date(dateTo);
            }

            let selectFields = '-_id -__v';
            if (!includePrescriptions) selectFields += ' -prescription';
            if (!includeVitalSigns) selectFields += ' -vitalSigns';

            const patientNotes = await PatientNotes.find(filter)
                .sort({ createdAt: -1 })
                .select(selectFields);

            if (groupByDoctor) {
                const groupedByDoctor = {};
                patientNotes.forEach(note => {
                    if (!groupedByDoctor[note.doctorId]) {
                        groupedByDoctor[note.doctorId] = [];
                    }
                    groupedByDoctor[note.doctorId].push(note);
                });

                return {
                    patientId: patientId,
                    medicalHistoryByDoctor: groupedByDoctor,
                    totalRecords: patientNotes.length,
                    groupedBy: 'doctor'
                };
            }

            const chronologicalHistory = patientNotes.map(note => ({
                ...note.toObject(),
                timelinePosition: this.calculateTimelinePosition(note.createdAt)
            }));

            const medicalSummary = this.generateMedicalSummary(patientNotes);

            return {
                patientId: patientId,
                chronologicalHistory: chronologicalHistory,
                medicalSummary: medicalSummary,
                totalRecords: patientNotes.length,
                groupedBy: 'chronological'
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Failed to fetch medical history: ${error.message}`
            );
        }
    }

    static generateMedicalSummary(patientNotes) {
        const summary = {
            totalVisits: patientNotes.length,
            visitTypeFrequency: {},
            commonDiagnoses: {},
            frequentSymptoms: {},
            prescriptionHistory: [],
            vitalTrends: {
                bloodPressure: [],
                heartRate: [],
                temperature: [],
                weight: []
            }
        };

        patientNotes.forEach(note => {
            summary.visitTypeFrequency[note.visitType] = 
                (summary.visitTypeFrequency[note.visitType] || 0) + 1;

            if (note.diagnosis) {
                summary.commonDiagnoses[note.diagnosis] = 
                    (summary.commonDiagnoses[note.diagnosis] || 0) + 1;
            }

            if (note.symptoms) {
                const symptoms = note.symptoms.split(',').map(s => s.trim());
                symptoms.forEach(symptom => {
                    summary.frequentSymptoms[symptom] = 
                        (summary.frequentSymptoms[symptom] || 0) + 1;
                });
            }

            if (note.prescription && Array.isArray(note.prescription)) {
                summary.prescriptionHistory.push(...note.prescription.map(p => ({
                    ...p,
                    prescribedDate: note.createdAt
                })));
            }

            if (note.vitalSigns) {
                if (note.vitalSigns.bloodPressure) {
                    summary.vitalTrends.bloodPressure.push({
                        value: note.vitalSigns.bloodPressure,
                        date: note.createdAt
                    });
                }
                if (note.vitalSigns.heartRate) {
                    summary.vitalTrends.heartRate.push({
                        value: note.vitalSigns.heartRate,
                        date: note.createdAt
                    });
                }
                if (note.vitalSigns.temperature) {
                    summary.vitalTrends.temperature.push({
                        value: note.vitalSigns.temperature,
                        date: note.createdAt
                    });
                }
                if (note.vitalSigns.weight) {
                    summary.vitalTrends.weight.push({
                        value: note.vitalSigns.weight,
                        date: note.createdAt
                    });
                }
            }
        });

        return summary;
    }

    static calculateTimelinePosition(date) {
        const now = new Date();
        const diffInDays = Math.floor((now - new Date(date)) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays <= 7) return `${diffInDays} days ago`;
        if (diffInDays <= 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays <= 365) return `${Math.floor(diffInDays / 30)} months ago`;
        
        return `${Math.floor(diffInDays / 365)} years ago`;
    }

    static async searchPatientNotes(searchParams) {
        try {
            const { 
                query, 
                patientId, 
                doctorId, 
                visitType, 
                dateFrom, 
                dateTo,
                page = 1, 
                limit = 10 
            } = searchParams;

            const filter = {};
            
            if (patientId) filter.patientId = patientId;
            if (doctorId) filter.doctorId = doctorId;
            if (visitType) filter.visitType = visitType;
            
            if (dateFrom || dateTo) {
                filter.createdAt = {};
                if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
                if (dateTo) filter.createdAt.$lte = new Date(dateTo);
            }

            if (query) {
                filter.$or = [
                    { notes: new RegExp(query, 'i') },
                    { diagnosis: new RegExp(query, 'i') },
                    { symptoms: new RegExp(query, 'i') },
                    { treatmentPlan: new RegExp(query, 'i') }
                ];
            }

            const skip = (page - 1) * limit;
            const searchResults = await PatientNotes.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-_id -__v');

            const total = await PatientNotes.countDocuments(filter);

            return {
                searchResults: searchResults,
                searchParams: searchParams,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    limit: parseInt(limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPreviousPage: page > 1
                }
            };
        } catch (error) {
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                false,
                `Search operation failed: ${error.message}`
            );
        }
    }

    static async validatePatientNoteAccess(noteId, userId, userRole) {
        try {
            const note = await PatientNotes.findOne({ noteId: noteId });
            if (!note) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Patient note not found.'
                );
            }

            if (userRole === 'admin') {
                return note;
            }

            if (userRole === 'doctor' && note.doctorId === userId) {
                return note;
            }

            if (userRole === 'patient' && note.patientId === userId) {
                return note;
            }

            throw new EasyQError(
                'ForbiddenError',
                httpStatusCode.FORBIDDEN,
                true,
                'You do not have permission to access this patient note.'
            );
        } catch (error) {
            throw error;
        }
    }
}