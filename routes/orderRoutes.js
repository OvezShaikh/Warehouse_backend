const express = require('express');
const router = express.Router();
const Order = require('../models/order'); // Assuming you've set up an Order model

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('customer products.product'); // Assuming you are using references
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
