const express = require('express');
const router = express.Router();
const Dispatcher = require('../models/Dispatcher');

// @route   GET /api/dispatchers
// @desc    Get all dispatchers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const dispatchers = await Dispatcher.find();
    res.status(200).json({ success: true, dispatchers });
  } catch (error) {
    console.error('Error fetching dispatchers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dispatchers' });
  }
});

// @route   POST /api/dispatchers
// @desc    Add a new dispatcher
// @access  Public
router.post('/', async (req, res) => {
  const { name, address, phone, email } = req.body;

  if (!name || !address || !phone) {
    return res.status(400).json({ success: false, message: 'Name, address, and phone are required' });
  }

  try {
    const newDispatcher = new Dispatcher({ name, address, phone, email });
    await newDispatcher.save();
    res.status(201).json({ success: true, message: 'Dispatcher added successfully', dispatcher: newDispatcher });
  } catch (error) {
    console.error('Error adding dispatcher:', error);
    res.status(500).json({ success: false, message: 'Failed to add dispatcher' });
  }
});


module.exports = router;
