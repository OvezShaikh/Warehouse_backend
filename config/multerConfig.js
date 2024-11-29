const multer = require('multer');
const path = require('path');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes'); // Set the folder to store resumes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp as file name
  }
});

// File type filter for validating uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt/; // Acceptable file extensions: pdf, doc, docx, txt
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true); // Accept the file
  } else {
    return cb(new Error('Invalid file type. Only .pdf, .doc, .docx, and .txt are allowed.'));
  }
};

// Create the multer upload middleware
const upload = multer({ 
  storage, 
  fileFilter // Use the fileFilter to validate file types
});

module.exports = upload;
