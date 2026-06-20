// backend/utils/mailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Send an email using Brevo (Sendinblue) SMTP.
 *
 * Required env vars:
 *   BREVO_SMTP_USERNAME – typically "your_account" (often "smtp_user")
 *   BREVO_SMTP_PASSWORD – the SMTP password (API key) from Brevo dashboard
 *   EMAIL_FROM – the display address used in the "From" header (e.g. no-reply@yourdomain.com)
 */
export async function sendMail({ to, subject, text, html }) {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', // Brevo's SMTP host
    port: 587,
    secure: false, // TLS – use STARTTLS
    auth: {
      user: process.env.BREVO_SMTP_USERNAME,
      pass: process.env.BREVO_SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: "Industrax-NiCeSoftServ",
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}
