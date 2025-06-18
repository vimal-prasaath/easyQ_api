import mongoose from "mongoose";
import generateUniqueId from "generate-unique-id";

const {Schema,model} = mongoose
const userSchema= new Schema({
   userId: { 
        type: String,
        required: true, 
        unique: true,   
        default: () => generateUniqueId({
            length: 4,
            useLetters: false, 
        })
    },
    name:{type:String},
    gender:{type:String},
    dateOfBirth:{type:String},
    email:{type:String ,unique:true},
    mobileNumber:{type:String},
    passwordHash:{type:String},
    sessionToken:{type:String},
    googleId:{type:String},
    location:{type:String}
    
})
const User=model('User',userSchema)
export default User