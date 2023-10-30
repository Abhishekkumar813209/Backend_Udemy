import {createTransport} from "nodemailer";
import ErrorHandler from "./errorHandler.js"
export const sendEmail = async (to,subject,text) =>{

    console.log('To:',to);
    console.log('SUbject',subject);
    console.log("Text",text);



    const transporter = createTransport({
        host:process.env.SMTP_HOST,
        port:process.env.SMTP_PORT,
        auth:{
            user:process.env.SMTP_USER,
            pass:process.env.SMTP_PASS,
        },
    })

    try{
        await transporter.sendMail({
            to,
            subject,
            text,
        })
        console.log("Email sent successfully ");
    }catch(error){
        console.log("Error sending email:",error);
        throw new ErrorHandler("Failed to send email",500); //you 
    }

}