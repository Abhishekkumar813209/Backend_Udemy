import {catchAsyncError} from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import User from "../models/User.js"
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import Course from "../models/Course.js";
import {response} from "express";
import cloudinary from "cloudinary"
import getDataUri from "../utils/dataUri.js"
import { Stats } from "../models/Stats.js";


export const register = catchAsyncError(async(req,res,next) =>{
    const {name,email,password} = req.body;
    const file = req.file;
    if(!email || !password || !name || !file) return next (new ErrorHandler("please enter all field" , 400));
    let user = await User.findOne({email})
    if(user) return next(new ErrorHandler("user Already Exists",400));

    //Upload file on cloudinary
    
    const fileUri = getDataUri(file);
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content)

    user = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url
        }
    })
    sendToken(res,user,"Registered Successfully")
})

export const login = catchAsyncError(async(req,res,next)=>{
    const {email,password} = req.body;

    if(!email || !password) return next(new ErrorHandler("Please enter all field" , 400));
    const user = await User.findOne({email}).select("+password")

    if(!user) return next(new ErrorHandler("Incorrect Email " , 401));

    const isMatch = await user.comparePassword(password);
    if(!isMatch) return next(new ErrorHandler("Incorrect Password",401))

    sendToken(res,user,`Welcome Back , ${user.name}`,200);
})


export const logout = catchAsyncError(async(req,res,next)=>{
        res.status(200).cookie("token",null,{
            expires:new Date(Date.now()),
            httpOnly:true,
            secure:true,
            sameSite:'none',
        })
        .json({
            success:true,
            message:"logout Successfully"
        });
})


export const getMyProfile = catchAsyncError(async(req,res,next)=>{
    const user = await User.findById(req.user._id);
    res.status(200).json({
        success:true,
        user   
    })
})


export const updateProfile = catchAsyncError(async(req,res,next)=>{
    const {name,email} = req.body;

    const user = await User.findById(req.user._id);

    if(name) user.name = name;
    if(email) user.email = email;

    await user.save();

    res.status(200).json({
        success:true,
        message:"Profile Update Successfully"
    })
})


export const updateProfilePicture = catchAsyncError(async(req,res,next)=>{
  
    const file = req.file;

    const user = await User.findById(req.user._id);

    const fileUri = getDataUri(file);
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content)

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    user.avatar = {
        public_id:mycloud.public_id,
        url:mycloud.secure_url
    }

    await user.save()
    
    res.status(200).json({
        success:true,
        message:"Profile Picture updated Successsfully"
    })
})

export const changePassword = catchAsyncError(async(req,res,next)=>{
    const {oldPassword,newPassword} = req.body;
    if(!oldPassword || !newPassword)
    return next(new ErrorHandler("Please enter all fields",400));

    const user = await User.findById(req.user._id).select("+password")
    const isMatch = await user.comparePassword(oldPassword);
    if(!isMatch) return next(new ErrorHandler("Incorrect Old Password",400));

    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success:true,
        message:"Password Changed Successfully"
    })
})


export const forgetPassword = catchAsyncError(async(req,res,next)=>{
    const {email} = req.body;
    const user = await User.findOne({email});

    if(!user){
        console.log("User not found");
        return next(new ErrorHandler("User Not Found",400));
    }
    console.log("User found",user);
    const resetToken = await user.getResetToken();
    console.log("Reset token:", resetToken);

    await user.save();
    const url = `${process.env.Frontend_URL}/resetpassword/${resetToken}`;
    console.log("Reset URL:",url);

    const message = `Click on the link to reset your password : ${url} . If your have not requested this, please ignore it.`;

    await sendEmail(user.email, "CourseBundler Reset Password", message);
    console.log("Email Sent to:" , user.email);

    res.status(200).json({
        success:true,
        message:`Reset Token has been sent to ${user.email}`,
    });
});

export const resetPassword = catchAsyncError(async(req,res,next)=>{
    const {token} = req.params;
    const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

    console.log("Hashed reset password token:" , resetPasswordToken);

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{
            $gt:Date.now(),
        },
    })

    console.log("User found:",user);

    if(!user){
        console.log("Invalid or expired Token");
        return next(new ErrorHandler("TOken in invalid or has been expired"));
    }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        console.log("Updated user:" , user);

        await user.save();

        res.status(200).json({
            success:true,
            message:"Password Changed Successfully"
        })
})

export const addToPlaylist = catchAsyncError(async(req,res,next)=>{
        const user = await User.findById(req.user._id);
        const course = await Course.findById(req.body.id);
        console.log(req.body.id)
        if(!course) return next(new ErrorHandler("Invalid Course Id",404));

        const itemExist = user.playlist.find((item)=>{
            if(item.course.toString()===course._id.toString()) return true
        })

        user.playlist.push({
            course:course._id,
            poster:course.poster.url,
        })

        await user.save();

        res.status(200).json({
            success:true,
            message:"Added to Playlist"
        })

})

export const removeFromPlaylist = catchAsyncError(async(req,res,next)=>{
    const user = await User.findById(req.user._id);
    const course = await Course.findById(req.query.id)

    if(!course) return next(new ErrorHandler("Invalid Course Id",404));

    const newPlaylist = user.playlist.filter(item=>{
        if(item.course.toString()!==course._id.toString()) return item;
    })

    user.playlist = newPlaylist
    await user.save();

    res.status(200).json({
        success:true,
        message:"Removed from Playlist"
    })
})


//Admin controllers 
export const getAllUsers = catchAsyncError(async(req,res,next)=>{
    const users = await User.find();
    res.status(200).json({
        success:true,
        users:users
    })
})

export const updateUserRole = catchAsyncError(async(req,res,next)=>{
    const user = await User.findById(req.params.id);
    if(!user) return next(new ErrorHandler("User not found",404));

    if(user.role === 0 || user.role==="user" || user.role===1) user.role ="admin";
   else if(user.role==="admin") user.role="user"

    // if(user.role==="admin") user.role==="user"
    await user.save();
   res.status(200).json({
    success:true,
    message:"Role Updated"
   })
})

export const deleteUser = catchAsyncError(async(req,res,next)=>{
    const user = await User.findById(req.params.id);

    if(!user) return next(new ErrorHandler("User not found",404));

    await cloudinary.v2.uploader.destroy(user.avatar.public_id)

    await user.deleteOne()

    //cancel Subscription

    res.status(200).json({
        success:true,
        message:"User deleted Successfully"
    })
})






User.watch().on("change",async()=>{
    const stats = await Stats.find({}).sort({createdAt:'desc'}).limit(1);

    const subscription = await User.find({"subscription.stats":"active"});

    stats[0].users = await User.countDocuments();
    stats[0].subscription = subscription.length;
    stats[0].createdAt = new Data(Date.now());

    await stats.save();
})

