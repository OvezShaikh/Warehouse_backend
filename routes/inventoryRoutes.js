// inventoryRoutes.js
const express = require('express');
const router = express.Router();
const { getProducts, updateProduct } = require('../controllers/inventoryController');
const protect = require('../middlewares/authMiddleware'); // Assuming you have auth middleware

// Route to get all products (with product locations)
router.get('/products', protect, getProducts);

// Route to update product details (e.g., stock updates)
router.post('/update-product', protect, updateProduct);

module.exports = router;
