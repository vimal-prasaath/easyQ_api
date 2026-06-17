import Doctor from '../model/doctor.js';
import Nurse from '../model/nurse.js';
import Hospital from '../model/hospital.js';
import { generateStaffAccessToken, generateRefreshToken, compareToken } from './tokenGenerator.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';

const STAFF_ROLES = ['doctor', 'nurse'];

export class StaffAuthTokenService {
    static _getModelForRole(role) {
        if (role === 'doctor') return Doctor;
        if (role === 'nurse') return Nurse;
        return null;
    }

    static _getUserIdField(role) {
        return role === 'doctor' ? 'doctorId' : 'nurseId';
    }

    static async _buildAccessTokenData(user, role) {
        if (role === 'doctor') {
            return {
                userId: user.doctorId,
                email: user.email,
                role: 'doctor'
            };
        }

        const hospital = await Hospital.findOne({ hospitalId: user.hospitalId }).select('adminId');
        return {
            userId: user.nurseId,
            role: 'nurse',
            email: user.email,
            hospitalId: user.hospitalId,
            adminId: hospital?.adminId || null
        };
    }

    static async issueTokens(user, role) {
        const accessTokenData = await this._buildAccessTokenData(user, role);
        const token = generateStaffAccessToken(role, accessTokenData);
        const refreshToken = generateRefreshToken({
            userId: accessTokenData.userId,
            role
        });

        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        return { token, refreshToken };
    }

    static async refresh(refreshToken) {
        if (!refreshToken) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Refresh token is required.'
            );
        }

        let decodedPayload;
        try {
            decodedPayload = await compareToken(refreshToken);
        } catch {
            throw new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid or expired refresh token.'
            );
        }

        const role = decodedPayload.data?.role;
        const userId = decodedPayload.data?.userId;

        if (
            decodedPayload.type !== 'refresh' ||
            !STAFF_ROLES.includes(role) ||
            !userId
        ) {
            throw new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Invalid refresh token.'
            );
        }

        const Model = this._getModelForRole(role);
        const idField = this._getUserIdField(role);
        const user = await Model.findOne({ [idField]: userId }).select('+refreshToken');

        if (!user || !user.isPasswordSet) {
            throw new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'User not found or account not activated.'
            );
        }

        if (!user.refreshToken || user.refreshToken !== refreshToken) {
            throw new EasyQError(
                'AuthenticationError',
                httpStatusCode.UNAUTHORIZED,
                true,
                'Refresh token has been revoked. Please login again.'
            );
        }

        const tokens = await this.issueTokens(user, role);

        return {
            message: 'Token refreshed successfully',
            token: tokens.token,
            refreshToken: tokens.refreshToken,
            loggedInAs: role
        };
    }

    static async logout(userId, role) {
        if (!STAFF_ROLES.includes(role)) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Invalid staff role.'
            );
        }

        const Model = this._getModelForRole(role);
        const idField = this._getUserIdField(role);
        const user = await Model.findOne({ [idField]: userId }).select('+refreshToken');

        if (!user) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                'User not found.'
            );
        }

        user.refreshToken = null;
        await user.save();

        return {
            message: 'Logged out successfully'
        };
    }
}
