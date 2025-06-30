import mongoose from "mongoose";
const MONGO_URL=process.env.MONGO_URI || 'mongodb://localhost:27017'
export const dbConnect=async()=>{
    try{
    await mongoose.connect(MONGO_URL,{
      dbName:"my_app"
    })
    }catch{
    console.log("DB is not connected")
    }

}