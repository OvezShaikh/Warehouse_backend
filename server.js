const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contact');
const jwt = require('jsonwebtoken'); // Ensure jwt is imported
const User = require('./models/User'); // Import your User model
const multer = require('multer'); // Import multer
const path = require('path'); // Import path module
const nodemailer = require('nodemailer');
const visitorsRoutes = require('./routes/visitor');
const Visitor = require('./models/Visitor');
const jobRoutes = require('./routes/jobRoutes');
const userRoutes = require('./routes/userRoutes');


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Enable CORS before defining routes
app.use(cors({
    origin: 'http://localhost:5173', // Your React app's URL
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ovezshaikh45154@gmail.com', // Replace with your Gmail
      pass: process.env.EMAIL_PASS,
    },
  });

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to store uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename the file to avoid conflicts
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            const error = new Error('Invalid file type');
            error.status = 400;
            return cb(error);
        }
        cb(null, true);
    },
    limits: { fileSize: 1024 * 1024 * 2 } // Limit file size to 2MB
});

// Define a simple root route
app.get('/', (req, res) => {
    res.send('API is running..., from my backend');
});


// Serve the frontend build for production
// app.use(express.static(path.join(__dirname, 'frontend/dist')));

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
// });



// Logout User
app.post('/api/auth/logout', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Bearer

    if (!token) {
        return res.status(401).json({ message: 'No token provided. Not authenticated' });
    }

    try {
        // Verify the token to ensure it's valid
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Optional: Here, you could implement token blacklisting if desired.

        // Respond with a success message
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ message: 'Invalid token or session has expired' });
    }
});


// Authentication login route
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            console.log('Incorrect password for username:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role, profilePicture: user.profilePicture},
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



// Profile picture upload route
app.post('/api/auth/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // Extract the token from Authorization header
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode token to get userId

        const filePath = `/${req.file.path}`;
        const user = await User.findById(decoded.userId); // Find user using decoded userId

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = filePath; // Save the file path to user document
        await user.save();

        res.json({ message: 'Profile picture uploaded successfully', profilePicture: filePath });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Error uploading profile picture', error });
    }
});

// Endpoint to handle form submissions

app.post('/send-application', (req, res) => {
    const { name, email, message, jobTitle } = req.body;
  
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER, // Replace with your email address
      subject: `Job Application: ${jobTitle}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Failed to send email', error });
      }
      return res.status(200).json({ message: 'Email sent successfully', info });
    });
  });

// Import routes
const notificationRoutes = require('./routes/notificationRoutes'); 
const inventoryRoutes = require('./routes/inventoryRoutes'); 
const locationRoutes = require('./routes/location'); // Adjust the path as necessary
const dockLocationRoutes = require('./routes/dockLocationRoutes');
const grnRoutes = require('./routes/grnRoutes');
const settingsRoutes = require('./routes/settings');  // Import the settings routes
const masterListRoutes = require('./routes/masterListRoutes');
const dispatcherRoutes = require('./routes/dispatcherRoutes');




// Use the routes
app.use('/api/auth', authRoutes);
app.use('/api', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/docklocations', dockLocationRoutes);
app.use('/api/grn', grnRoutes);
app.use('/uploads', express.static('uploads')); // Serve the uploads directory
app.use('/api/settings', settingsRoutes);  // This is where your profile-related routes are defined
app.use('/api/visitors', visitorsRoutes);  // Add the visitors route
app.use('/api/jobs', jobRoutes);  // Use the job routes here
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/masterlist', masterListRoutes);
app.use('/api/dispatchers', dispatcherRoutes);





// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 20000, 
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
