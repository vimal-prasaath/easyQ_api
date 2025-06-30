import mongoose from "mongoose";

const userToken= new mongoose.Schema({
    userId:{type:String , require:true},
    fcmToken:{type:String}

})

const UserToken= mongoose.model('UserToken',userToken)


export default UserToken