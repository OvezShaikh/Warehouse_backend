const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs'); // for password hashing
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Your user model
const router = express.Router();
const { getProfile } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware'); 

// Set up multer for handling profile picture uploads
const upload = multer({ 
  dest: 'uploads/', // The 'uploads' folder will store the profile pictures
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB limit for file size
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Invalid file type');
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  }
});
 // The 'uploads' folder will store the profile pictures

// Register Route (with profile picture upload)
router.post('/register', upload.single('profilePicture'), async (req, res) => {
  console.log('Received request at /register');
  // const { username, email, password, role } = req.body; // Removed profilePicture from here
  console.log('Received data:', req.body);

  try {
    const { username, email, password, role } = req.body;
    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Handle the uploaded profile picture
    const profilePicture = req.file ? req.file.path : null; // Use req.file.path to get the uploaded file path

    // Create a new user
    user = new User({
      username,
      email,
      password,
      role: role || 'user', // Default to 'user' if no role is provided
      profilePicture, // Save the file path of the profile picture
    });

    // Hash the password before saving the user
    // user.password = await bcrypt.hash(password, 10); // Ensure password is hashed
    await user.save(); // Save will call the pre-save hook for hashing

    // Create and return JWT token
    const payload = {
      user: { id: user._id, role: user.role, email: user.email, profilePicture: user.profilePicture }, // Include profilePicture in payload
    };
    const token = jwt.sign(
      { userId: user._id, role: user.role, profilePicture: user.profilePicture }, 
      // payload.user,
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(201).json({ token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});


// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;  // Change from username to email

  try {
    // Querying by email instead of username
    const user = await User.findOne({ email }).select('+password');  

      if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Generate a token
      // const token = jwt.sign(
      // { userId: user._id, role: user.role, profilePicture: user.profilePicture },
      //     process.env.JWT_SECRET,
      //     { expiresIn: '30d' }
      // );

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });


      const userData = {
        username: user.username,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        token,
      };

    res.json(userData);

  } catch (err) {
    console.error('Error during login:', err);
      res.status(500).json({ message: 'Server error' });
  }
});

// Profile picture upload route
router.post('/upload-profile-picture', authMiddleware, upload.single('profilePicture'), async (req, res) => {
    const userId = req.user.userId; // Extract userId from the authenticated request
    const filePath = `/${req.file.path}`; // Adjust based on how you serve static files

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = filePath; // Save the file path to the user document
        await user.save();

        res.json({ message: 'Profile picture uploaded successfully', profilePicture: filePath });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading profile picture', error });
    }
});

// Get Profile Route
// Add this route in your backend server.js or a separate routes file
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password'); // Exclude password field
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//put request for profile page
router.put('/profile', async (req, res) => {
  const { username, email, bio, profilePicture, currentPassword, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    // Handle password update if new passwords are provided
    if (currentPassword && newPassword && confirmPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Incorrect current password' });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ msg: 'New passwords do not match' });
      }

      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Update fields
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.profilePicture = profilePicture || user.profilePicture;

    await user.save();
    res.json({ msg: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Add the changePassword method here, in the same way you've defined the other routes
router.put('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // User data from the middleware
    const user = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash the new password and update the user record
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;

    // Save the updated user to the database
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});




// Logout Route
router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Bearer

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Not authenticated' });
  }

  try {
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Respond with a success message
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;
