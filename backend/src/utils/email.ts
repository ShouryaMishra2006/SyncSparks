import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()
const transporter = nodemailer.createTransport({
service: "gmail",
host: "smtp.gmail.com",
port: 587,
secure: false,
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS
}
});


export const sendOtpEmail = async (to: string, otp: string) => {
   console.log(process.env.EMAIL_USER)
   console.log(to)
   console.log(otp)
   console.log("EMAIL_USER:", process.env.EMAIL_USER)

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to:to,
      subject: "Verify your Sync Sparks account",
      text: `Your OTP is ${otp}`,
    })
    console.log("Email sent:", info.messageId)
  } catch (error) {
    console.error("Error sending email:", error)
  }
}
