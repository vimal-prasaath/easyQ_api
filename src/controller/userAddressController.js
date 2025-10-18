import User from '../model/userProfile.js';
import { EasyQError } from '../config/error.js';
import { httpStatusCode } from '../util/statusCode.js';
import { logInfo, logError } from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Add new address to user
 * POST /api/user/address
 */
export const addUserAddress = async (req, res, next) => {
    try {
        const { userId, addressName, origin, fullAddress, street, city, state, pincode, isDefault } = req.body;

        // Validate required fields
        if (!userId || !addressName || !origin) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'userId, addressName, and origin are required'
            );
        }

        // Validate coordinates
        const { lat, lng } = origin;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'Invalid coordinates: lat must be -90 to 90, lng must be -180 to 180'
            );
        }

        // Find user
        const user = await User.findOne({ userId });
        if (!user) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `User ${userId} not found`
            );
        }

        // Generate unique address ID
        const addressId = uuidv4();

        // Ensure addresses array exists
        if (!Array.isArray(user.addresses)) {
            user.addresses = [];
        }

        // If this is set as default, unset other defaults in-memory
        if (isDefault && user.addresses.length > 0) {
            user.addresses.forEach(addr => { addr.isDefault = false; });
        }

        // Add new address
        const newAddress = {
            addressId,
            addressName,
            origin: { lat, lng },
            fullAddress: fullAddress || null,
            street: street || null,
            city: city || null,
            state: state || null,
            pincode: pincode || null,
            isDefault: isDefault || false
        };

        user.addresses.push(newAddress);
        await user.save();

        logInfo('User address added', {
            userId,
            addressId,
            addressName,
            coordinates: { lat, lng }
        });

        return res.status(httpStatusCode.CREATED).json({
            status: 'success',
            message: 'Address added successfully',
            data: {
                userId: user.userId,
                address: newAddress
            }
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/user/address',
            userId: req.body?.userId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to add user address'
        ));
    }
};

/**
 * Get all user addresses
 * GET /api/user/address/{userId}
 */
export const getUserAddresses = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'userId is required'
            );
        }

        const user = await User.findOne({ userId }).select('userId addresses');
        
        if (!user) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `User ${userId} not found`
            );
        }

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'User addresses retrieved successfully',
            data: {
                userId: user.userId,
                addresses: user.addresses || [],
                totalCount: user.addresses?.length || 0
            }
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/user/address',
            userId: req.params?.userId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to get user addresses'
        ));
    }
};

/**
 * Update specific user address
 * PUT /api/user/address/{userId}/{addressId}
 */
export const updateUserAddress = async (req, res, next) => {
    try {
        const { userId, addressId } = req.params;
        const { addressName, origin, fullAddress, street, city, state, pincode, isDefault } = req.body;

        if (!userId || !addressId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'userId and addressId are required'
            );
        }

        // Validate coordinates if provided
        if (origin) {
            const { lat, lng } = origin;
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                throw new EasyQError(
                    'ValidationError',
                    httpStatusCode.BAD_REQUEST,
                    true,
                    'Invalid coordinates: lat must be -90 to 90, lng must be -180 to 180'
                );
            }
        }

        const user = await User.findOne({ userId });
        if (!user) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `User ${userId} not found`
            );
        }

        const addressIndex = user.addresses.findIndex(addr => addr.addressId === addressId);
        if (addressIndex === -1) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Address ${addressId} not found for user ${userId}`
            );
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            user.addresses.forEach(addr => {
                if (addr.addressId !== addressId) {
                    addr.isDefault = false;
                }
            });
        }

        // Update address
        const address = user.addresses[addressIndex];
        if (addressName) address.addressName = addressName;
        if (origin) address.origin = origin;
        if (fullAddress !== undefined) address.fullAddress = fullAddress;
        if (street !== undefined) address.street = street;
        if (city !== undefined) address.city = city;
        if (state !== undefined) address.state = state;
        if (pincode !== undefined) address.pincode = pincode;
        if (isDefault !== undefined) address.isDefault = isDefault;

        await user.save();

        logInfo('User address updated', {
            userId,
            addressId,
            addressName: address.addressName
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Address updated successfully',
            data: {
                userId: user.userId,
                address: address
            }
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/user/address',
            userId: req.params?.userId,
            addressId: req.params?.addressId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to update user address'
        ));
    }
};

/**
 * Delete user address
 * DELETE /api/user/address/{userId}/{addressId}
 */
export const deleteUserAddress = async (req, res, next) => {
    try {
        const { userId, addressId } = req.params;

        if (!userId || !addressId) {
            throw new EasyQError(
                'ValidationError',
                httpStatusCode.BAD_REQUEST,
                true,
                'userId and addressId are required'
            );
        }

        const user = await User.findOne({ userId });
        if (!user) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `User ${userId} not found`
            );
        }

        const addressIndex = user.addresses.findIndex(addr => addr.addressId === addressId);
        if (addressIndex === -1) {
            throw new EasyQError(
                'NotFoundError',
                httpStatusCode.NOT_FOUND,
                true,
                `Address ${addressId} not found for user ${userId}`
            );
        }

        const deletedAddress = user.addresses[addressIndex];
        user.addresses.splice(addressIndex, 1);
        await user.save();

        logInfo('User address deleted', {
            userId,
            addressId,
            addressName: deletedAddress.addressName
        });

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            message: 'Address deleted successfully',
            data: {
                userId: user.userId,
                deletedAddress: {
                    addressId: deletedAddress.addressId,
                    addressName: deletedAddress.addressName
                }
            }
        });

    } catch (error) {
        logError(error, { 
            endpoint: '/api/user/address',
            userId: req.params?.userId,
            addressId: req.params?.addressId
        });
        
        if (error instanceof EasyQError) {
            return next(error);
        }
        
        next(new EasyQError(
            'InternalServerError',
            httpStatusCode.INTERNAL_SERVER_ERROR,
            true,
            'Failed to delete user address'
        ));
    }
};
