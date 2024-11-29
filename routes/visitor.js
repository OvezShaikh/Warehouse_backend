// server/routes/visitors.js
const express = require('express');
const Visitor = require('../models/Visitor');

const router = express.Router();


//all visitors
router.post('/', async (req, res) => {
    const { status } = req.body;
  
    if (!status || (status !== 'active' && status !== 'bounce')) {
      return res.status(400).json({ message: 'Invalid visitor status' });
    }
  
    try {
      const newVisitor = new Visitor({ status });
      await newVisitor.save();
      res.status(201).json({ message: 'Visitor recorded successfully' });
    } catch (error) {
      console.error('Error recording visitor:', error);
      res.status(500).json({ message: 'Error recording visitor' });
    }
  });

// Endpoint to get active visitors count
router.get('/active', async (req, res) => {
  try {
    const activeVisitorsCount = await Visitor.countDocuments({ status: 'active' });
    res.json({ activeVisitors: activeVisitorsCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active visitors' });
  }
});

// Endpoint to get bounce visitors count
router.get('/bounce', async (req, res) => {
  try {
    const bounceVisitorsCount = await Visitor.countDocuments({ status: 'bounce' });
    res.json({ bounceVisitors: bounceVisitorsCount });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bounce visitors' });
  }
});

module.exports = router;
