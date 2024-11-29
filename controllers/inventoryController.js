// controllers/inventoryController.js

const Product = require('../models/Product');
const Location = require('../models/Location');
const io = require('../server'); // Import the io instance for real-time updates

// Get all products (with location details)
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate('location');  // Assuming 'location' is a reference in Product
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// Update a product (e.g., add/remove stock)
exports.updateProduct = async (req, res) => {
    try {
        const { productId, locationId, quantityChange } = req.body;
        const product = await Product.findById(productId);
        const location = await Location.findById(locationId);

        if (!product || !location) {
            return res.status(404).json({ error: 'Product or Location not found' });
        }

        // Update product stock and location current load
        product.totalStock += quantityChange;
        const productInLocation = location.products.find(p => p.productId.toString() === productId);

        if (productInLocation) {
            productInLocation.quantity += quantityChange;
        } else {
            location.products.push({ productId, quantity: quantityChange });
        }

        location.currentLoad += quantityChange;

        await product.save();
        await location.save();

        // Emit real-time update to frontend
        io.emit('stockUpdate', { product, location });

        res.status(200).json({ message: 'Inventory updated successfully', product, location });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
};
