import express from "express"
import User from '../model/userProfile.js'
import { generatePasswordHash } from "../util/authController.js";
import Appointment from '../model/appointment.js'
import Favourite from '../model/hospital/favourite.js'
import UserToken from '../model/fcmModel.js'
import SearchSuggestion from '../model/search.js'
import HospitalDetails from "../model/hospital/facility.js";
export const getAllUser=async(req,res)=>{
    const users = await User.find();
      res.status(200).json(users);
}

export const updateUser=async(req,res)=>{
  const {userId} =req.params
  console.log(userId,req.params)
const {  name, gender, dateOfBirth, email, mobileNumber, password } = req.body;

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
          console.log(updateUser,updateFields)
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            message: 'User updated successfully'
        });
}
export const finduser= async(req,res) =>{
  const {userId}=req.body
  if(!userId){
    return res.status(400).json({ message: 'User ID is required.' });
  }
  const user= await User.findOne({userId:userId})
  if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

         res.status(200).json({
            message: 'User found successfully',
            user: user
        });
}

export const deleteUser=async(req,res)=>{
  try{
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
     // 1. Delete appointments where user is patient
    await Appointment.deleteOne({ patientId: userId });

    // 2. Delete user's favourite hospitals
    await Favourite.deleteOne({ userId });

    // 3. Delete user's FCM token
    await UserToken.deleteOne({ userId });

    // 4. Delete search suggestions
    await SearchSuggestion.deleteOne({ userId });

    // 5. Delete the user record
    await User.deleteOne({ userId });

    //6 .Delete the facility record
    await HospitalDetails.deleteOne({userId})

    res.status(200).json({ message: "User and related data deleted successfully" });
  }catch(e){
     res.status(500).json({ message: "Internal server error" });
  }
}


