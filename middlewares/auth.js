import jwt from "jsonwebtoken"
import { catchAsyncError } from "./catchAsyncError.js"
import ErrorHandler from "../utils/errorHandler.js"
import User from "../models/User.js";


// export const isAuthenticated = catchAsyncError(async(req,res,next)=>{
//     const {token} = req.cookies;
//     console.log(token);
//     if(!token) return next (new ErrorHandler("Not Logged In",401));

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = await User.findById(decoded._id);
//         next();
//     } catch (error) {
//         // Handle the JWT verification error here4
//         console.log(error)
//         console.error('JWT Verification Error:', error.message);
//         next(new ErrorHandler("Invalid Token"));
//     }c
// })

export const isAuthenticated = async (req, res, next) => {
    const { token } = req.cookies;
  
    if (!token) {
      return next(new ErrorHandler('Not Logged In', 401));
    }
  
    try {
      // Verify the token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  
      // Access the payload (claims) from the decoded token
      const { _id, role, exp } = decodedToken;
  
      // Get the user from the database based on the user ID (_id) extracted from the token
      req.user = await User.findById(_id);
  
      // You can also check if the token is expired (optional)
      const currentTime = Date.now() / 1000; // Convert current time to Unix timestamp
      if (exp < currentTime) {
        return next(new ErrorHandler('Token has expired', 401));
      }
  
      // Continue with the next middleware or route handler
      next();
    } catch (error) {
      // Handle token verification errors here
      console.error('JWT Verification Error:', error.message);
      next(new ErrorHandler('Invalid Token', 401));
    }
  };

export const authorizeAdmin = (req,res,next) =>{
    if(req.user.role!=="admin")
    return next(
        new ErrorHandler(
            `${req.user.role} is not allowed to access this Route` , 403
        )
    );
    next();
}

export const authorizeSubscribers = (req, res, next) => {
    if (req.user.subscription.status !== "active" && req.user.role !== "admin") {
      return next(new ErrorHandler("Only Subscribers can access this course"));
    }
    next();
}