const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true, // SKU should be unique
  },
  description: {
    type: String,
  },
  minStockLevel: {
    type: Number, // Min stock level to prevent stockout
    default: 10,  // Default value 10 if not provided
  },
  maxStockLevel: {
    type: Number, // Max stock level to prevent overstock
    default: 100, // Default value 100 if not provided
  },
  totalStock: {
    type: Number,
    default: 0,   // Default total stock to 0
  },
  amount: {
    type: Number,
    default: 0,
  },
  location: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location' },
});

module.exports = mongoose.model('Product', productSchema);
