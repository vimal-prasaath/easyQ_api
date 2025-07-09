 import { isUser } from "./authController.js"
 import {TokenGenerator} from "./tokenGenerator.js"
 import User from "../model/userProfile.js"
 import { EasyQError } from "../config/error.js"
 import { httpStatusCode } from "./statusCode.js"
 export async function validUser(password,hash){
   try{
      const validUser= await isUser(password,hash)
      return validUser
      
   }catch(e){
        throw new EasyQError(
            'PasswordComparisonError',
            httpStatusCode.INTERNAL_SERVER_ERROR, 
            false, 
            `An unexpected error occurred during password comparison: ${e.message}`
        );
   }
}

export async function updateToken(token,userId){
     try{
        const result= await User.updateOne({userId:userId},{sessionToken:token})
           if (result.matchedCount === 0) {
            throw new EasyQError(
                'UserNotFoundError',
                httpStatusCode.NOT_FOUND, 
                true, 
                `User with ID ${userId} not found.`
            );
        }
      }catch(e){
           throw new EasyQError(
            'DatabaseUpdateError',
            httpStatusCode.INTERNAL_SERVER_ERROR, 
            false, 
            `Failed to update session token for user ${userId}: ${e.message}`
        );
      }
}

export async function getSessionToken(response){
 const token=await TokenGenerator({userId:response.userId,email:response.email})
 return token
}