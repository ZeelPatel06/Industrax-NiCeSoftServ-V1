import nodemailer from "nodemailer";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

export const sendOTPEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.verify();

        console.log("SMTP Connected");

        const mailOptions = {
            from: `"Industrax" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Verify Your Email - Industrax",
            html: ` <div style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 40px 20px;"> <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"> <div style="background: #111827; padding: 25px; text-align: center;"> <h1 style="color: #ffffff; margin: 0;">Industrax</h1> <p style="color: #9ca3af; margin-top: 8px;"> Industrial Solutions Simplified </p> </div> <div style="padding: 40px 30px;"> <h2 style="color: #111827; margin-bottom: 20px;"> Verify Your Email </h2> <p style="font-size: 16px; color: #4b5563; line-height: 1.6;"> Welcome to <strong>Industrax</strong>. Use the verification code below to complete your registration. </p> <div style="text-align: center; margin: 35px 0;"> <div style=" display: inline-block; background: #111827; color: #ffffff; font-size: 32px; letter-spacing: 8px; padding: 18px 35px; border-radius: 10px; font-weight: bold; "> ${otp} </div> </div> <p style="font-size: 15px; color: #6b7280; line-height: 1.6;"> This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone. </p> <p style="font-size: 15px; color: #6b7280; line-height: 1.6;"> If you did not request this email, you can safely ignore it. </p> </div> <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;"> <p style="margin: 0; color: #9ca3af; font-size: 14px;"> © 2026 Industrax. All rights reserved. </p> </div> </div> </div> `,
        };

        const result = await transporter.sendMail(mailOptions);

        console.log("Email sent:", result.response);

        return result;

    } catch (error) {
        console.error("EMAIL ERROR:", error);
        throw error;
    }
};