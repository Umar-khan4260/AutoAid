const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'AutoAid Account Verification OTP',
    text: `Your OTP for AutoAid account verification is: ${otp}. This code expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to AutoAid!</h2>
        <p>Your OTP for account verification is:</p>
        <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email sending failed');
  }
};

module.exports = sendOtpEmail;
