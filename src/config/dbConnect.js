import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URI || 'mongodb://localhost:27017';

export const dbConnect = async () => {
    try {
        await mongoose.connect(MONGO_URL, {
            dbName: "my_app",
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("DB connected successfully!"); 
    } catch (error) {
        console.error("DB connection failed!:", error.message); 
        throw error;
    }
};