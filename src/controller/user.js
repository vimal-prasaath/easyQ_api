import express from "express"
import User from '../model/userProfile.js'
import { generatePasswordHash } from "../util/authController.js";

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


