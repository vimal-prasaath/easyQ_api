import User from "../model/userProfile.js"
import bcrypt from 'bcrypt'
export async function getUserDetails(email){
 try{
 const user=await User.findOne({email:email})
 return user
 }catch(e){
  throw new Error(e)
 }
}

export async function isUser(password,hash){
  try{
   const match=await bcrypt.compare(password,hash)
   return match
  }catch(e){
   throw new Error(e)
  }
}

export async function generatePasswordHash(plainPassword){
  try{
      console.log(plainPassword)
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      console.log(hashedPassword)
      return hashedPassword;

  }catch(e){
  throw new Error(e)
  }
}