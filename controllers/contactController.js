const transporter = require('../config/emailConfig');

exports.sendContactEmail = (req, res) => {
  const { name, email, message, sendCopy } = req.body;

  // Validate form data
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Set up the email data
  const mailOptions = {
    from: email,
    to: 'your-email@gmail.com',
    subject: 'New Contact Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: 'Error sending the email' });
    } else {
      // Optionally, send a copy to the user if "sendCopy" is checked
      if (sendCopy) {
        const userMailOptions = {
          from: 'your-email@gmail.com',
          to: email,
          subject: 'We received your message',
          text: `Hello ${name},\n\nThank you for your message. We will get back to you shortly.\n\nYour message:\n${message}`,
        };
        transporter.sendMail(userMailOptions, (err, info) => {
          if (err) console.log(err);
        });
      }
      return res.status(200).json({ message: 'Message sent successfully' });
    }
  });
};
