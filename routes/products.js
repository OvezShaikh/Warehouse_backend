const express = require('express');
const Product = require('../models/Product'); // Your product model
const Location = require('../models/Location');
const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('location');
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new product
router.post('/', async (req, res) => {
  const { name, sku, description, minStockLevel, maxStockLevel, totalStock, amount } = req.body;

  try {
    const newProduct = new Product({
      name,
      sku,
      description,
      minStockLevel,
      maxStockLevel,
      totalStock,
      amount,
    });

    await newProduct.save(); // Save the new product
    res.status(201).json(newProduct); // Respond with the added product
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a product by its ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, sku, description, minStockLevel, maxStockLevel, totalStock, amount } = req.body;

  try {
    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product fields
    product.name = name || product.name;
    product.sku = sku || product.sku;
    product.description = description || product.description;
    product.minStockLevel = minStockLevel || product.minStockLevel;
    product.maxStockLevel = maxStockLevel || product.maxStockLevel;
    product.totalStock = totalStock || product.totalStock;
    product.amount = amount || product.amount;

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a product's location by its ID
router.patch('/:id/location', async (req, res) => {
  const { id } = req.params;
  const { location } = req.body; // Expecting { location: 'locationId' }

  try {
    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const locationExists = await Location.findById(location);
    if (!locationExists) {
      return res.status(400).json({ message: 'Invalid location ID' });
    }
    // Update the product's location
    product.location = location; // Assuming location is an ObjectId reference
    await product.save();

    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete multiple products by their IDs
router.delete('/', async (req, res) => {
  const { ids } = req.body; // Expecting an array of ids from the frontend

  try {
    // Find and delete all products by their IDs
    const result = await Product.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No products found to delete' });
    }

    res.json({ message: `${result.deletedCount} products removed successfully` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to count products by SKU
router.get('/count', async (req, res) => {
  const { sku } = req.query;

  if (!sku) {
    return res.status(400).json({ error: 'SKU is required' });
  }

  try {
    const count = await Product.countDocuments({ sku });
    return res.json({ count });
  } catch (error) {
    console.error('Error counting products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
