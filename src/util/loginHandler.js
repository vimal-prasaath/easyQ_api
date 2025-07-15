
 import { isUser } from "./authController.js"
 import {TokenGenerator} from "./tokenGenerator.js"
 import User from "../model/userProfile.js"
 import { authLogger } from "../config/logger.js"
 
 export async function validUser(password,hash){
   try{
      const validUser= await isUser(password,hash)
      authLogger.debug('Password validation performed', { isValid: validUser });
      return validUser
      
   }catch(e){
      authLogger.error('Password validation error', {
        error: e.message,
        stack: e.stack
      });
      throw e;
   }
}

export async function updateToken(userId,token){
     try{
        const updateResult= await User.updateOne({userId:userId},{sessionToken:token})

          if (updateResult.acknowledged && updateResult.modifiedCount > 0) {
            authLogger.info('Session token updated successfully', { userId });
            return { success: true, message: 'Token updated successfully.' };
        } else if (updateResult.acknowledged && updateResult.matchedCount === 0) {
            authLogger.warn('Attempted to update token for non-existent user', { userId });
            return { success: false, error: 'User not found for token update.' };
        } else {
            authLogger.debug('Token update acknowledged but no modification made', { userId, token });
            return { success: true, message: 'Token already up to date or no change needed.' };
        }
      }catch(e){
          throw new Error(e)
      }
}

export async function getToken(response){
 const token=await TokenGenerator({userId:response.userId,email:response.email,role:response.role})
 return token
}
