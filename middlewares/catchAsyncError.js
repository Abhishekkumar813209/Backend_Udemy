export const catchAsyncError = (passedFunction) =>(req,res,next) =>{
    try{
        passedFunction(req,res,next);
    }catch(err){
        next(err)
    }
}

// export const catchAsyncError = (passedFunction) => (req, res, next) => {
//     Promise.resolve(passedFunction(req, res, next)).catch(next);
//   };
  