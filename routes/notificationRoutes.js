const express = require('express');
const Notification = require('../models/Notification');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all notifications for a logged-in user
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
