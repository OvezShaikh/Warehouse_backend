const mongoose = require('mongoose');

// Schema for each item in the GRN
const grnItemSchema = new mongoose.Schema({
  itemNo: { type: String, required: true }, // Item number is required
  description: { type: String, required: true }, // Description is required
  quantity: { type: Number, required: true }, // Quantity is required
  serialNumber: { type: String, required: true }, // Serial number is required
  invoiceNo: { type: String, required: true }, // Invoice number is required
  dockCode: {type: String, required: true },
  receivingDate: { type: Date, required: true }, // Receiving date is required
  status: { type: String, enum: ['OK', 'Rejected', 'Pending'], default: 'Pending' },
  okQuantity: { type: Number, default: 0   },
  rejectedQuantity: { type: Number, default: 0  },
  currentQuantity: {type: Number, default: 0 },
  amount: {type: Number},
  dispatchedQuantity: {type: Number, default: 0},
});

// Main GRN schema
const grnSchema = new mongoose.Schema({
  poNumber: { type: String, required: true }, // PO number is required
  receivingNo: { type: String, required: true }, // Unique receiving number is required
  status: { type: String, enum: ['OK', 'Rejected', 'Pending'], default: 'Pending' },
  receivingDate: { type: Date, required: true }, // Receiving date is required
  supplier: { type: String, required: true }, // Supplier is required
  items: {
    type: [grnItemSchema], // Array of items
    validate: {
      validator: function (v) {
        return v.length > 0; // Ensure at least one item is present
      },
      message: 'At least one item is required.'
    },
    required: true // Mark items as required
  },
  status: {
    type: String,
    enum: ['OK', 'Rejected', 'Pending'], // Allowed statuses
    default: 'Pending', // Default status if not provided
  },
}, { timestamps: true }); // Automatically create createdAt and updatedAt fields

// Create the GRN model
const GRN = mongoose.model('GRN', grnSchema);

module.exports = GRN;
