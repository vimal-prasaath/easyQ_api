import Hospital from '../model/hospital.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError, logWarn } from '../config/logger.js';

export class HospitalService {
    
    static async createHospital(hospitalData) {
        try {
            logInfo('Creating hospital', {
                hospitalName: hospitalData.hospitalName,
                city: hospitalData.city,
                state: hospitalData.state
            });

            const newHospital = await Hospital.create(hospitalData);
            
            logInfo('Hospital created successfully', {
                hospitalId: newHospital.hospitalId,
                hospitalName: newHospital.hospitalName
            });

            return newHospital;
        } catch (error) {
            logError('Error creating hospital', {
                error: error.message,
                stack: error.stack,
                hospitalData
            });
            throw error;
        }
    }

    static async getHospitalById(hospitalId) {
        try {
            const hospital = await Hospital.findOne({ hospitalId });

            if (!hospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital not found.'
                );
            }

            return hospital;
        } catch (error) {
            logError('Error retrieving hospital', {
                error: error.message,
                hospitalId
            });
            throw error;
        }
    }

    static async getAllHospitals() {
        try {
            const hospitals = await Hospital.find({});
            
            logInfo('Retrieved all hospitals', {
                count: hospitals.length
            });
            
            return hospitals;
        } catch (error) {
            logError('Error retrieving all hospitals', {
                error: error.message
            });
            throw error;
        }
    }

    static async updateHospital(hospitalId, updateData) {
        try {
            const updatedHospital = await Hospital.findOneAndUpdate(
                { hospitalId },
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedHospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital not found.'
                );
            }

            logInfo('Hospital updated successfully', {
                hospitalId,
                updateData
            });

            return updatedHospital;
        } catch (error) {
            logError('Error updating hospital', {
                error: error.message,
                hospitalId,
                updateData
            });
            throw error;
        }
    }

    static async deleteHospital(hospitalId) {
        try {
            const deletedHospital = await Hospital.findOneAndDelete({ hospitalId });

            if (!deletedHospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    'Hospital not found.'
                );
            }

            logInfo('Hospital deleted successfully', {
                hospitalId
            });

            return deletedHospital;
        } catch (error) {
            logError('Error deleting hospital', {
                error: error.message,
                hospitalId
            });
            throw error;
        }
    }

    static async searchHospitals(searchQuery) {
        try {
            const searchRegex = new RegExp(searchQuery, 'i');
            
            const hospitals = await Hospital.find({
                $or: [
                    { hospitalName: searchRegex },
                    { city: searchRegex },
                    { state: searchRegex },
                    { speciality: searchRegex }
                ]
            });

            logInfo('Hospital search completed', {
                searchQuery,
                resultsCount: hospitals.length
            });

            return hospitals;
        } catch (error) {
            logError('Error searching hospitals', {
                error: error.message,
                searchQuery
            });
            throw error;
        }
    }

    static async getHospitalsByCity(city) {
        try {
            const hospitals = await Hospital.find({ 
                city: new RegExp(city, 'i') 
            });

            logInfo('Retrieved hospitals by city', {
                city,
                count: hospitals.length
            });

            return hospitals;
        } catch (error) {
            logError('Error retrieving hospitals by city', {
                error: error.message,
                city
            });
            throw error;
        }
    }

    static async getHospitalsByState(state) {
        try {
            const hospitals = await Hospital.find({ 
                state: new RegExp(state, 'i') 
            });

            logInfo('Retrieved hospitals by state', {
                state,
                count: hospitals.length
            });

            return hospitals;
        } catch (error) {
            logError('Error retrieving hospitals by state', {
                error: error.message,
                state
            });
            throw error;
        }
    }

    static async getHospitalsBySpeciality(speciality) {
        try {
            const hospitals = await Hospital.find({ 
                speciality: new RegExp(speciality, 'i') 
            });

            logInfo('Retrieved hospitals by speciality', {
                speciality,
                count: hospitals.length
            });

            return hospitals;
        } catch (error) {
            logError('Error retrieving hospitals by speciality', {
                error: error.message,
                speciality
            });
            throw error;
        }
    }

    static async addDoctorIdToDepartment(){

    }
}