const express = require('express');
const router = express.Router();
const transporter = require('../config/emailConfig');

router.post('/', async (req, res) => {
    const { name, email, message, sendCopy } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Compose email content for the admin
    const adminMailOptions = {
        from: process.env.EMAIL_USER, // Sender email address (from .env)
        to: process.env.EMAIL_USER,  // The admin's email
        subject: `Contact Form Submission from ${name}`,
        text: `You have received a new message from your website contact form.
        
Name: ${name}
Email: ${email}
Message:
${message}
        `,
    };

    // Compose email content for the sender if 'sendCopy' is true
    let userMailOptions = null;
    if (sendCopy) {
        userMailOptions = {
            from: process.env.EMAIL_USER, // Sender email address (from .env)
            to: email,                    // The sender's email (the user's email)
            subject: `Copy of your message to ${name}`,
            text: `Hello ${name},

Thank you for contacting us. Here is a copy of your message:

Message:
${message}

We will get back to you shortly!

Best regards,
${process.env.EMAIL_USER}
            `,
        };
    }

    try {
        // Send the message to the admin
        await transporter.sendMail(adminMailOptions);

        // Send a copy to the user if requested
        if (userMailOptions) {
            await transporter.sendMail(userMailOptions);
        }

        res.status(200).json({ message: 'Your message has been sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send the message. Please try again later.' });
    }
});


module.exports = router;
