import User from "../model/userProfile.js"
import {generatePasswordHash} from '../util/authController.js'
export async function signUp(req,res){

   
        try{
            let data=req.body
            data["passwordHash"]= await generatePasswordHash(req.body["password"])

            const newUser=await User.create(data)
            res.status(200).json({
                            message: "User registered successfully!",
                            userId: newUser._id,
                            email: newUser.email
                            });
        }catch(e){
          throw new Error(e)
        }
  
}