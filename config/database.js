import mongoose from "mongoose";

export const connectDB = async(req,res)=>{
    const {connection} = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected with ${connection.host}`)
}