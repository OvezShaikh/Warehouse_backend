const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();
const moment = require('moment');  // Using moment.js to handle date calculations


/**
 * GET /api/users
 * Get all users (Admin only)   
 */
router.get('/', async (req, res) => {
    try {
        // Get current date and calculate the start of the current and previous week
        const currentDate = moment();
        const startOfCurrentWeek = currentDate.clone().startOf('isoWeek').toDate();  // ISO Week (Monday as the first day)
        const startOfPreviousWeek = currentDate.clone().subtract(1, 'week').startOf('isoWeek').toDate();
        
        // Get users created in the current week and previous week
        const currentWeekUsers = await User.find({
            createdAt: { $gte: startOfCurrentWeek },
        }).select('_id');  // Select only necessary fields
        
        const previousWeekUsers = await User.find({
            createdAt: { $gte: startOfPreviousWeek, $lt: startOfCurrentWeek },
        }).select('_id');  // Select only necessary fields

        // Prepare the data to send to the frontend
        const usersData = [
            {
                name: "Current Week",
                data: currentWeekUsers.length || 0,  // Number of users created in the current week
            },
            {
                name: "Previous Week",
                data: previousWeekUsers.length || 0,  // Number of users created in the previous week
            },
        ];

        res.status(200).json(usersData);  // Send formatted data to the frontend
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/users/:id
 * Get user by ID (Admin or authorized user)
 */
router.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure user is either admin or fetching their own data
        if (req.user.role !== 'admin' && req.user._id !== user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/users/:id
 * Update user by ID (Admin or authorized user)
 */
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { username, email, bio, role } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure user is either admin or updating their own data
        if (req.user.role !== 'admin' && req.user._id !== user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update fields
        user.username = username || user.username;
        user.email = email || user.email;
        user.bio = bio || user.bio;

        // Admin can update role
        if (req.user.role === 'admin') {
            user.role = role || user.role;
        }

        await user.save();
        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * DELETE /api/users/:id
 * Delete user by ID (Admin only)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Ensure only admin can delete users
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
