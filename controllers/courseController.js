import Course from "../models/Course.js";
import { catchAsyncError } from "../middlewares/catchAsyncError.js"
import ErrorHandler from "../utils/errorHandler.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from 'cloudinary';
import { Stats } from "../models/Stats.js";

export const getAllCourse = catchAsyncError(async(req,res,next)=>{

    const {title,category} = req.query;
  
    const courses = await Course.find({
        title:{
            $regex:title?title:"",
        },
        category:category?category:undefined,
    }).select("-lectures");
    res.status(200).json({
        success:true,
        courses,
    })
})

export const getAllCourses = catchAsyncError(async(req,res,next)=>{
    const courses = await Course.find();
    res.status(200).json({
        success:true,
        courses
    })
})

export const createCourse = catchAsyncError(async(req,res,next)=>{
    const {title,description,category,createdBy} = req.body;
    console.log("Request body: create Course");

    if(!title || !description || !category || !createdBy){
        console.log("Missing fields in request");
        return next(new ErrorHandler("Please enter add all fields" ,400))
    }
;
    const file = req.file;
    const fileUri = getDataUri(file);
    

    try{

        const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
        console.log("Cloudinary response:",mycloud);

        const newCourse = await Course.create({
            title,
            description,
            category,
            createdBy,
            poster:{
                public_id:mycloud.public_id,
                url:mycloud.secure_url
            },
        })


        res.status(201).json({
            success:true,
            message:"Course Created Successfully . You can add lectures now"
        })
    } catch(err){
        console.log(err)
        return next(new ErrorHandler("Failed to create course"))
    }
})

//Get course Lectures
export const getCourseLectures = catchAsyncError(async(req,res,next)=>{
    const course = await Course.findById(req.params.id);

    if(!course) return next(new ErrorHandler("Course not found",404));
    // console.log(course)
    course.views +=1;
    
    await course.save();
    const {lectures} = course;
   const falana =  lectures.map(item=>(
        item.video.public_id
    ))
    console.log(falana);
    res.status(200).json({
        success:true,
        lectures:course.lectures,
    })
})

export const addLecture = catchAsyncError(async(req,res,next) =>{
    const{id} = req.params;
    const {title,description} = req.body;
    const course = await Course.findById(id);
    if(!course) return next (new ErrorHandler("Course not found",404));

    const file = req.file;
    const fileUri = getDataUri(file)
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content,{
        resource_type:"video",
    })
    
    course.lectures.push({
        title,
        description,
        video:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url,
        }
    });


    course.numOfVideos = course.lectures.length;
    course.views +=1;

    await course.save();

    res.status(200).json({
        success:true,
        message:"Lecture added in course"
    })
})

export const deleteCourse = catchAsyncError(async(req,res,next)=>{
    console.log("Inside createCourse");

    const {id} = req.params;

    const course = await Course.findById(id);
    console.log(course)
    if(!course){
        return next(new ErrorHandler("Course Not found",404));
    }
    
    if(course.poster && course.poster.public_id){
        await cloudinary.v2.uploader.destroy(course.poster.public_id);
    }
    const {lectures} = course
    
    for(let i=0;i<course.lectures.length ; i++){
        course.lectures = course.lectures[i];
        if(lectures.video&& lectures.video.public_id){
            await cloudinary.v2.uploader.destroy(lectures.video.public_id,{
                resource_type:"Video"
            });
        }
    }

    await course.deleteOne({_id:id});

    await cloudinary.v2.uploader.destroy(course.poster.public_id);

    // for(let i =0; i<course.lectures.length; i++){
    //     const singleLecture = course.lectures[i];
    //     await cloudinary.v2.uploader.destroy(singleLecture.video.public_id);
    //     console.log(singleLecture.video.public_id);
    // }
    // await course.remove();
    res.status(200).json({
        success:true,
        message:"Course deleted Successfully"
    })
})

export const deleteLecture = catchAsyncError(async(req,res,next)=>{
    const {courseId,lectureId} = req.query;

    const course = await Course.findById(courseId);

    if(!course){
        return next(new ErrorHandler("Course not found",404))
    }
    const lecture = course.lectures.find((item)=>{
        console.log(item._id)
        console.log(courseId)
        console.log(lectureId.toString())
        if(item._id.toString() ===lectureId.toString()) return item;
    });
    console.log(lecture);
    await cloudinary.v2.uploader.destroy(lecture.video.public_id,{
        resource_type:"video"
    })

    course.lectures = course.lectures.filter(item=>{
        if(item._id.toString()!== lectureId.toString()) return item;
    })

    course.numOfVideos = course.lectures.length;

    await course.save();

    res.status(200).json({
        success:true,
        message:"Lecture Deleted Successfully"
    })
})



Course.watch().on("change",async()=>{
    const stats = await Stats.find({}).sort({createdAt:'desc'}).limit(1);

    const courses = await Course.find({});

    totalViews = 0;

    for(let i=0;i<courses.length ;i++){
        totalViews +=courses[i].views;
    }
    stats[0].views = totalViews;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
})

