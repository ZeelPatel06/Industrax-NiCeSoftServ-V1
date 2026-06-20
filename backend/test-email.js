// test-email.js – tests Brevo SMTP via the mailService utility
import { sendMail } from './utils/mailService.js';

async function sendTest() {
  const info = await sendMail({
    to: 'niravkp560@gmail.com',     // change to any inbox you can check
    subject: 'Your Industrax Verification Code',
    text: 'Hello,\n\nYour Industrax verification code is: 123456\n\nThis code is valid for 10 minutes.\n\nBest regards,\nThe Industrax Team',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Industrax Verification</h2>
        <p>Hello,</p>
        <p>Thank you for registering with Industrax. Please use the verification code below to complete your registration:</p>
        <div style="font-size: 24px; font-weight: bold; margin: 20px 0; padding: 15px; background-color: #f3f4f6; text-align: center; border-radius: 5px;">
          123456
        </div>
        <p>This code is valid for 10 minutes. If you did not request this, please safely ignore this email.</p>
        <br>
        <p>Best regards,<br>The Industrax Team</p>
      </div>`,
  });
  console.log('✅ Message sent:', info.messageId || info.response);
}

sendTest().catch((err) => {
  console.error('❌ Failed to send email:', err.message || err);
});

