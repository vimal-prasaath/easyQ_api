import AdminProfile from '../model/adminProfile.js';

/**
 * Mongo filter: active hospital whose AdminProfile has verificationStatus Approved.
 */
export async function approvedActiveHospitalListingFilter() {
    const approvedAdminIds = (await AdminProfile.distinct('adminId', {
        verificationStatus: 'Approved',
    })).filter((id) => id != null && String(id).trim() !== '');

    return {
        isActive: true,
        adminId: { $in: approvedAdminIds },
    };
}
