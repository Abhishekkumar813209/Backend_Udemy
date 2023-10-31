import express from "express"
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"

//dotenv configuration
dotenv.config({
    path:"./config/config.env"
})


//express usage
const app = express();
const allowedOrigins = ['https://wonderful-kulfi-628471.netlify.app'];
//middlewares
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
    extended:true,
}))
app.use(cookieParser());

 
//Importing Routes
import user from "./routes/userRoutes.js"
import course from "./routes/courseRoutes.js"
import payment from "./routes/paymentRoutes.js"
import other from "./routes/otherRoutes.js"

app.use("/api/v1",user);
app.use("/api/v1",course);
app.use("/api/v1",payment);
app.use("/api/v1",other);

export default app;