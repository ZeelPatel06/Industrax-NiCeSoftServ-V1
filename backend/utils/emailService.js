// Updated email service to use Brevo (Sendinblue) SMTP via our generic mailService utility
import { sendMail } from "./mailService.js";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

/**
 * Sends the OTP email using Brevo (Sendinblue) SMTP.
 * Uses the generic `sendMail` helper which expects {to, subject, text, html}.
 */
export const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Industrax Verification</h2>
      <p>Hello,</p>
      <p>Thank you for registering with Industrax. Please use the verification code below to complete your registration:</p>
      <div style="font-size: 24px; font-weight: bold; margin: 20px 0; padding: 15px; background-color: #f3f4f6; text-align: center; border-radius: 5px;">
        ${otp}
      </div>
      <p>This code is valid for 10 minutes. If you did not request this, please safely ignore this email.</p>
      <br>
      <p>Best regards,<br>The Industrax Team</p>
    </div>`;

  try {
    const result = await sendMail({
      to: email,
      subject: "Your Industrax Verification Code",
      html,
      text: `Hello,\n\nYour Industrax verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nBest regards,\nThe Industrax Team`,
    });
    console.log("OTP email sent via Brevo:", result.messageId || result.response);
    return result;
  } catch (err) {
    console.error("Failed to send OTP via Brevo:", err);
    throw err;
  }
};