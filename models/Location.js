const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  locationCode: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true
  },
  currentLoad: {
    type: Number,
    default: 0 ,
  },
  stock: { 
    type: Number, 
    default: 0 ,
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      default: 0
    }
  }]
});

module.exports = mongoose.model('Location', locationSchema);
