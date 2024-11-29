const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', // Reference to the Job model
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'] // Email validation regex
  },
  message: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
