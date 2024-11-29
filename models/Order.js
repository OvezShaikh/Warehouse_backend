const mongoose = require('mongoose');

// Sub-schema for products within an order
const orderProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',  // Reference to the Product model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1'],
  },
});

// Schema for the entire order
const orderSchema = new mongoose.Schema({
  customer: {
    name: {
      type: String,
      required: true,
    },
    position: {
      type: String,
    },
    mobile: {
      type: String,
      required: true,
    },
    address: {
      type: String, // Optional: customer's delivery address
    },
  },
  products: [orderProductSchema], // Array of products in the order
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],  // Order status
    default: 'pending',  // Default status is 'pending'
  },
  totalAmount: {
    type: Number,
    default: 0,  // Calculated based on the products' prices and quantities
  },
  createdAt: {
    type: Date,
    default: Date.now, // Order creation timestamp
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Last update timestamp
  },
});

// Add pre-save middleware to update `updatedAt` timestamp
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
