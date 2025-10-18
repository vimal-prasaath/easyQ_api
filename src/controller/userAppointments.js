import Appointment from '../model/appointment.js';
import User from '../model/userProfile.js';
import Hospital from '../model/hospital.js';
import { calculateUserHospitalDistance, calculateApproximateTravelTime } from '../util/distanceCalculator.js';

/**
 * Get user appointments with detailed information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserAppointments = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId parameter
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Find user to get user name
        const user = await User.findOne({ userId: userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find all appointments for the user
        const appointments = await Appointment.find({ patientId: userId })
            .sort({ appointmentDate: 1, appointmentTime: 1 });

        if (!appointments || appointments.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No appointments found for this user',
                data: []
            });
        }

        // Get unique hospital IDs to fetch hospital details
        const hospitalIds = [...new Set(appointments.map(apt => apt.hospitalId))];
        const hospitals = await Hospital.find({ hospitalId: { $in: hospitalIds } });

        // Create a map for quick hospital lookup
        const hospitalMap = {};
        hospitals.forEach(hospital => {
            hospitalMap[hospital.hospitalId] = hospital;
        });

        // Format the response data with distance and travel time
        const formattedAppointments = await Promise.all(appointments.map(async appointment => {
            const hospital = hospitalMap[appointment.hospitalId];
            
            // Calculate distance between user and hospital
            const distance = hospital ? calculateUserHospitalDistance(user, hospital) : null;
            
            // Calculate approximate travel time
            const approximateTime = hospital ? await calculateApproximateTravelTime(user, hospital) : null;
            
            return {
                userId: appointment.patientId,
                userName: user.name,
                hospitalName: appointment.hospitalName,
                appointmentTime: appointment.appointmentTime,
                googleMapLink: hospital ? hospital.googleMapLink : null,
                doctorName: appointment.doctorName,
                appointmentDate: appointment.appointmentDate,
                appointmentId: appointment.appointmentId,
                status: appointment.status,
                slotNumber: appointment.slotNumber,
                tokenNumber: appointment.tokenNumber,
                tokenDisplay: appointment.tokenDisplay,
                distance: distance, // Distance in kilometers
                approximateTime: approximateTime // Travel time range like "10-15 min"
            };
        }));

        return res.status(200).json({
            success: true,
            message: 'User appointments retrieved successfully',
            data: formattedAppointments
        });

    } catch (error) {
        console.error('Error fetching user appointments:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
