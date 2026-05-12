import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

export const sendOTPEmail = async (email, otp) => {
    try {
        const oauth2Client = new OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });

        const accessToken = await new Promise((resolve, reject) => {
            oauth2Client.getAccessToken((err, token) => {
                if (err) {
                    console.error("OAuth2 Dynamic Token Generation Failed:", err.message);
                    if (process.env.ACCESS_TOKEN) {
                        console.log("Using fallback ACCESS_TOKEN from .env");
                        resolve(process.env.ACCESS_TOKEN);
                    } else {
                        reject("Failed to create access token: " + err.message);
                    }
                } else {
                    resolve(token);
                }
            });
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_USER,
                accessToken,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            },
        });

        const mailOptions = {
            subject: "Your Verification OTP",
            text: `Your OTP for registration is: ${otp}. It is valid for 10 minutes.`,
            to: email,
            from: process.env.EMAIL_USER,
        };

        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error("Could not send OTP email. Please check your email credentials.");
    }
};
