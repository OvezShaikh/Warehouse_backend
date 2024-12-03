const mongoose = require('mongoose');
  const express = require('express');
  const jwt = require('jsonwebtoken'); 
  const Job = require('../models/Job');
  const Application = require('../models/Application');
  const transporter = require('../config/emailConfig');
  const upload = require('../config/multerConfig'); // Import the multer config
  // const authenticateUser = require('../middlewares/authMiddleware'); // Keep this to authenticate the user
  // const { isAdmin } = require('../middlewares/roleMiddleware'); // Add roleMiddleware

  const router = express.Router();

  // GET all job openings (accessible to all users)
  router.get('/', async (req, res) => {
    try {
      const jobs = await Job.find(); // Fetch all job openings
      res.status(200).json({ jobs });
    } catch (err) {
      console.error('Error fetching jobs:', err);
      res.status(500).json({ message: 'Failed to fetch jobs' });
    }
  });

  // POST a new job opening (Admin only)
  // router.post('/jobs', authenticateUser, isAdmin, async (req, res) => {
  //   const { title, description } = req.body;

  //   // Ensure the required fields are present
  //   if (!title || !description) {
  //     return res.status(400).json({ message: 'Title and description are required' });
  //   }

  //   try {
  //     const newJob = new Job({ title, description });
  //     await newJob.save();
  //     res.status(201).json({ job: newJob });
  //   } catch (err) {
  //     console.error('Error posting job:', err);
  //     res.status(500).json({ message: 'Failed to post job' });
  //   }
  // });
  router.post('/', async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    try {
      const newJob = new Job({ title, description });
      await newJob.save();
      res.status(201).json({ job: newJob });
    } catch (err) {
      console.error('Error posting job:', err);
      res.status(500).json({ message: 'Failed to post job' });
    }
  });

  // POST a job application (Authenticated users can apply)

  // router.post('/apply', authenticateUser, async (req, res) => {
  //   const { jobId, name, email, message } = req.body;

  //   // Ensure the required fields are present
  //   if (!jobId || !name || !email || !message) {
  //     return res.status(400).json({ message: 'Job ID, name, email, and message are required' });
  //   }

  //   try {
  //     const application = new Application({ jobId, name, email, message });
  //     await application.save();
  //     res.status(200).json({ message: 'Application submitted successfully!' });
  //   } catch (err) {
  //     console.error('Error submitting application:', err);
  //     res.status(500).json({ message: 'Failed to submit application' });
  //   }
  // });

  router.post('/:jobId/apply', upload.single('resume'), async (req, res) => {
    const { jobId } = req.params; // Get jobId from URL parameter
    const { name, email, message } = req.body;
  
    // Ensure the required fields are present
    if (!jobId || !name || !email || !message || !req.file) {
      return res.status(400).json({ message: 'Job ID, name, email, message, and resume are required' });
    }
  
    try {
      // Create and save the application in the database
      const application = new Application({
        jobId,
        name,
        email,
        message,
        resume: req.file.path, // Save resume file path
      });
      await application.save();
  
      // Send email to the admin about the new application
      const mailOptions = {
        from: email, // Sender's email (applicant's email)
        to: process.env.EMAIL_USER, // Admin's email from .env file
        subject: 'New Job Application Submitted',
        text: `You have received a new job application for the position:
  
        Job Title: ${jobId}
        Applicant: ${name}
        Email: ${email}
        Message: ${message}
  
        Please review the application and respond accordingly.`,

        attachments: [
          {
            filename: req.file.originalname, // Use the original filename of the uploaded file
            path: req.file.path, // Path to the uploaded file
          },
        ],
      };
  
      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ message: 'Failed to send email notification' });
        }
        console.log('Email sent: ' + info.response);
      });
  
      // Respond with success message
      res.status(200).json({ message: 'Application submitted successfully!' });
    } catch (err) {
      console.error('Error submitting application:', err);
      res.status(500).json({ message: 'Failed to submit application' });
    }
  });



  // GET all applications (Admin only)
  // router.get('/applications', authenticateUser, isAdmin, async (req, res) => {
  //   try {
  //     const applications = await Application.find(); // Fetch all applications
  //     res.status(200).json({ applications });
  //   } catch (err) {
  //     console.error('Error fetching applications:', err);
  //     res.status(500).json({ message: 'Failed to fetch applications' });
  //   }
  // });

  router.get('/applications', async (req, res) => {
    try {
      const applications = await Application.find(); // Fetch all applications
      res.status(200).json({ applications });
    } catch (err) {
      console.error('Error fetching applications:', err);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });

  // DELETE a job opening (Admin only)
  // router.delete('/jobs/:jobId', authenticateUser, isAdmin, async (req, res) => {
  //   const { jobId } = req.params;

  //   try {
  //     const job = await Job.findByIdAndDelete(jobId);
  //     if (!job) {
  //       return res.status(404).json({ message: 'Job not found' });
  //     }
  //     res.status(200).json({ message: 'Job deleted successfully' });
  //   } catch (err) {
  //     console.error('Error deleting job:', err);
  //     res.status(500).json({ message: 'Failed to delete job' });
  //   }
  // });

  router.delete('/:jobId', async (req, res) => {
    const { jobId } = req.params;  // Destructuring for cleaner code
    
    // Validate if the jobId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }
  
    try {
      // Attempt to delete the job using the jobId
      const job = await Job.findByIdAndDelete(jobId);
      
      // If no job is found, return a 404 error
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Successfully deleted the job
      return res.status(200).json({ message: 'Job deleted successfully' });
    } catch (err) {
      // Log the error for debugging purposes
      console.error('Error deleting job:', err);
      
      // Return a 500 error in case of an unexpected server error
      return res.status(500).json({ message: 'Failed to delete job due to server error', error: err.message });
    }
  });
  

  // DELETE an application (Admin only)
  // router.delete('/applications/:applicationId', authenticateUser, isAdmin, async (req, res) => {
  //   const { applicationId } = req.params;

  //   try {
  //     const application = await Application.findByIdAndDelete(applicationId);
  //     if (!application) {
  //       return res.status(404).json({ message: 'Application not found' });
  //     }
  //     res.status(200).json({ message: 'Application deleted successfully' });
  //   } catch (err) {
  //     console.error('Error deleting application:', err);
  //     res.status(500).json({ message: 'Failed to delete application' });
  //   }
  // });


  router.delete('/applications/:applicationId', async (req, res) => {
    const { applicationId } = req.params;

    try {
      const application = await Application.findByIdAndDelete(applicationId);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      res.status(200).json({ message: 'Application deleted successfully' });
    } catch (err) {
      console.error('Error deleting application:', err);
      res.status(500).json({ message: 'Failed to delete application' });
    }
  });

  module.exports = router;
