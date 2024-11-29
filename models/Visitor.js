// server/models/Visitor.js
const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['active', 'bounce'],
    required: true,
  },
  count: { type: Number, default: 0 },
  // Additional fields (like timestamps) can be added here
}, { timestamps: true });

module.exports = mongoose.model('Visitor', VisitorSchema);
