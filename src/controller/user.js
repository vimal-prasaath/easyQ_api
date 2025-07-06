import express from "express"
import User from '../model/userProfile.js'
import { generatePasswordHash } from "../util/authController.js";
import Appointment from '../model/appointment.js'
import Favourite from '../model/hospital/favourite.js'
import UserToken from '../model/fcmModel.js'
import SearchSuggestion from '../model/search.js'
import HospitalDetails from "../model/hospital/facility.js";
import { EasyQError } from '../config/error.js'; 
import { httpStatusCode } from '../util/statusCode.js'
export const getAllUser = async (req, res , next) => {
  try {
    const users = await User.find();
    res.status(httpStatusCode.OK).json(users); 
  } catch (error) {
    next(new EasyQError(
      'DatabaseError',
      httpStatusCode.INTERNAL_SERVER_ERROR,
      false,
      `Failed to retrieve users: ${error.message}`
    ));
  }
}

export const updateUser = async (req, res , next) => {
   try {
    const { userId } = req.params;
    const { name, gender, dateOfBirth, email, mobileNumber, password } = req.body;

    const updateFields = {
      name,
      gender,
      dateOfBirth,
      email,
      mobileNumber,
    };

    if (password) {
      updateFields.passwordHash = await generatePasswordHash(password); 
     }

    const updatedUser = await User.findOneAndUpdate(
      { userId: userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return next(new EasyQError(
        'NotFoundError',
        httpStatusCode.NOT_FOUND,
        true, 
        'User not found.'
      ));
    }

    res.status(httpStatusCode.OK).json({ 
      message: 'User updated successfully'
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
    next(error);
  }
}
export const finduser = async (req, res , next) => {
 try {
    const { userId } = req.body;
    if (!userId) {
      return next(new EasyQError(
        'ValidationError',
        httpStatusCode.BAD_REQUEST,
        true,
        'User ID is required.'
      ));
    }
    const user = await User.findOne({ userId: userId });

    if (!user) {
      return next(new EasyQError(
        'NotFoundError',
        httpStatusCode.NOT_FOUND,
        true,
        'User not found.'
      ));
    }

    res.status(httpStatusCode.OK).json({ 
      message: 'User found successfully',
      user: user
    });
  } catch (error) {
    next(new EasyQError(
      'DatabaseError',
      httpStatusCode.INTERNAL_SERVER_ERROR,
      false, 
      `Failed to find user: ${error.message}`
    ));
  }
}

export const deleteUser = async (req, res, next) => {
 try {
    const { userId } = req.params;

    if (!userId) {
      return next(new EasyQError(
        'ValidationError',
        httpStatusCode.BAD_REQUEST,
        true,
        "User ID is required."
      ));
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return next(new EasyQError(
        'NotFoundError',
        httpStatusCode.NOT_FOUND,
        true,
        "User not found."
      ));
    }

    // Perform deletions for related data
    await Appointment.deleteOne({ patientId: userId });
    await Favourite.deleteOne({ userId });
    await UserToken.deleteOne({ userId });
    await SearchSuggestion.deleteOne({ userId });
    await HospitalDetails.deleteOne({ userId }); 

    // Finally, delete the user record
    await User.deleteOne({ userId });

    res.status(httpStatusCode.OK).json({ message: "User and related data deleted successfully" }); 
  } catch (error) {
    next(new EasyQError(
      'DatabaseError',
      httpStatusCode.INTERNAL_SERVER_ERROR,
      false, // isOperational: false
      `Failed to delete user and related data: ${error.message}`
    ));
  }
}


