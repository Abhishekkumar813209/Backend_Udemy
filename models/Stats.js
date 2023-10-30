import mongoose from "mongoose";

const schema = new mongoose.Schema({
    users:{
        type:Number,
        required:true
    },
    subscription:{
        type:String,
        required:true
    },
    views:{
        type:Number,
        required:true
    },

    createdAt:{
        type:Date,
        default:Date.now
    }
})

export const Stats = mongoose.model("State",schema);