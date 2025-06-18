 import { isUser } from "./authController.js"
 import {TokenGenerator} from "./tokenGenerator.js"
 import User from "../model/userProfile.js"
 export async function validUser(password,hash){
   try{
      const validUser= await isUser(password,hash)
      return validUser
      
   }catch(e){
      console.log(e)
   }
}

export async function updateToken(token,userId){
     try{
        const sessionToken= await User.updateOne({userId:userId},{sessionToken:token})
        
      }catch(e){
          throw new Error(e)
      }
}

export async function getToken(response){
 const token=await TokenGenerator({_id:response._id,email:response.email})
 return token
}