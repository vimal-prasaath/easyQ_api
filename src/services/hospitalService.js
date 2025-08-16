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

    static async addFacilities(hospitalId, facilities) {
        try {
            // Validate hospital exists
            const hospital = await Hospital.findOne({ hospitalId: hospitalId });
            if (!hospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Hospital with ID ${hospitalId} not found.`
                );
            }

            if (!hospital.isActive) {
                throw new EasyQError(
                    'HospitalInactiveError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Cannot add facilities. Hospital with ID ${hospitalId} is inactive.`
                );
            }

            // Validate facilities data
            if (!Array.isArray(facilities) || facilities.length === 0) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Facilities array is required and cannot be empty.'
                );
            }

            // Validate each facility
            for (const facility of facilities) {
                if (!facility.name || !facility.type) {
                    throw new EasyQError(
                        'ValidationError',
                        httpStatusCode.BAD_REQUEST,
                        true,
                        'Each facility must have name and type.'
                    );
                }
            }

            // Add facilities to hospital
            const addedFacilities = [];
            for (const facility of facilities) {
                const newFacility = {
                    name: facility.name,
                    type: facility.type,
                    description: facility.description || '',
                    isAvailable: facility.isAvailable !== false, // Default to true
                    addedAt: new Date()
                };
                
                hospital.facilities.push(newFacility);
                addedFacilities.push(newFacility);
            }

            await hospital.save();

            return {
                hospitalId: hospitalId,
                addedCount: addedFacilities.length,
                addedFacilities: addedFacilities,
                totalFacilities: hospital.facilities.length
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                `Failed to add facilities: ${error.message}`
            );
        }
    }

    static async updateFacilities(hospitalId, facilities) {
        try {
            // Validate hospital exists
            const hospital = await Hospital.findOne({ hospitalId: hospitalId });
            if (!hospital) {
                throw new EasyQError(
                    'NotFoundError',
                    httpStatusCode.NOT_FOUND,
                    true,
                    `Hospital with ID ${hospitalId} not found.`
                );
            }

            if (!hospital.isActive) {
                throw new EasyQError(
                    'HospitalInactiveError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    `Cannot update facilities. Hospital with ID ${hospitalId} is inactive.`
                );
            }

            // Validate facilities data
            if (!Array.isArray(facilities) || facilities.length === 0) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Facilities array is required and cannot be empty.'
                );
            }

            // Validate each facility
            for (const facility of facilities) {
                if (!facility.id || !facility.name || !facility.type) {
                    throw new EasyQError(
                        'ValidationError',
                        httpStatusCode.BAD_REQUEST,
                        true,
                        'Each facility must have id, name, and type.'
                    );
                }
            }

            // Update facilities
            const updatedFacilities = [];
            for (const facilityUpdate of facilities) {
                const facilityIndex = hospital.facilities.findIndex(f => f._id.toString() === facilityUpdate.id);
                
                if (facilityIndex === -1) {
                    throw new EasyQError(
                        'NotFoundError',
                        httpStatusCode.NOT_FOUND,
                        true,
                        `Facility with ID ${facilityUpdate.id} not found.`
                    );
                }

                // Update facility
                hospital.facilities[facilityIndex] = {
                    ...hospital.facilities[facilityIndex],
                    name: facilityUpdate.name,
                    type: facilityUpdate.type,
                    description: facilityUpdate.description || hospital.facilities[facilityIndex].description,
                    isAvailable: facilityUpdate.isAvailable !== undefined ? facilityUpdate.isAvailable : hospital.facilities[facilityIndex].isAvailable,
                    updatedAt: new Date()
                };

                updatedFacilities.push(hospital.facilities[facilityIndex]);
            }

            await hospital.save();

            return {
                hospitalId: hospitalId,
                updatedCount: updatedFacilities.length,
                updatedFacilities: updatedFacilities,
                totalFacilities: hospital.facilities.length
            };
        } catch (error) {
            if (error instanceof EasyQError) {
                throw error;
            }
            throw new EasyQError(
                'DatabaseError',
                httpStatusCode.INTERNAL_SERVER_ERROR,
                true,
                `Failed to update facilities: ${error.message}`
            );
        }
    }

    static async addDoctorIdToDepartment(){

    }
}