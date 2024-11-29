const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');  // Assuming you have a User model
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');



// Middleware to check JWT and get the user
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication failed: No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Authentication failed: Invalid token' });
    }

    try {
      // Fetch user from DB
      const user = await User.findById(decoded.userId);
      if (!user) {
        console.error('User not found for ID:', decoded.userId);
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = user;
      next();  // Proceed to the next middleware or route handler
    } catch (error) {
      return res.status(500).json({ message: 'Server error' });
    }
  });
};

// Get user profile
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const user = req.user;  // The user data is attached by the authenticateJWT middleware
    const userData = {
      username: user.username,
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
    };
    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Update user profile
router.put('/profile', authenticateJWT, async (req, res) => {
  const { username, email, bio, currentPassword, newPassword, confirmPassword } = req.body;
  const profilePicture = req.files?.profilePicture; // Handle file upload if exists

  try {
    const user = req.user; // Attach user data from the authenticated JWT
    
    // Validate and update password only if currentPassword and newPassword are provided
    if (newPassword || confirmPassword) {
      // Ensure current password is provided and valid
      if (!currentPassword || !(await user.isPasswordValid(currentPassword))) {
        return res.status(400).json({ message: 'Current password is incorrect or missing' });
      }

      // Ensure new password and confirm password match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New password and confirm password do not match' });
      }

      // Hash and update the new password
      user.password = await user.hashPassword(newPassword); // Assuming `hashPassword` is a method in your User model
    }

    // Update profile picture if provided
    if (profilePicture) {
      const filePath = `uploads/profiles/${user.username}_profile.jpg`;
      await profilePicture.mv(filePath); // Use .mv() to move the uploaded file
      user.profilePicture = filePath; // Store the file path in user profile
    }

    // Update other profile fields only if provided
    if (username) user.username = username;
    if (email) user.email = email;
    if (bio) user.bio = bio;

    // Save the updated user document
    await user.save();

    return res.json({ message: 'Profile updated successfully', profilePicture: user.profilePicture });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Error updating user profile' });
  }
});


// router.put('/change-password', authenticateJWT, async (req, res) => {
//   const { currentPassword, newPassword } = req.body;

//   try {
//     const user = req.user;

//     // Ensure user exists
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Validate inputs
//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ message: 'Current password and new password are required' });
//     }

//     // Check if current password matches
//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Current password is incorrect' });
//     }

//     // Prevent using the same password
//     if (await bcrypt.compare(newPassword, user.password)) {
//       return res.status(400).json({ message: 'New password cannot be the same as the old password' });
//     }

//     // Update password
//     user.password = newPassword; // Triggers the `pre('save')` hook
//     await user.save();

//     res.status(200).json({ message: 'Password updated successfully' });
//   } catch (error) {
//     console.error('Error changing password:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });




module.exports = router;
