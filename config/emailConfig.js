require('dotenv').config();  // To load environment variables from .env file

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // Set your email user in the .env file
    pass: process.env.EMAIL_PASS,  // Set your email password in the .env file
  },
});

module.exports = transporter;
