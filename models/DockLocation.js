// models/DockLocation.js
const mongoose = require('mongoose');

const dockLocationSchema = new mongoose.Schema({
  dockCode: {
    type: String,
    required: true,
    unique: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  locationCode: { 
    type: String, 
    unique: true, 
    required: true, 
    ref: 'Location',
  },
}, { timestamps: true });

const DockLocation = mongoose.model('DockLocation', dockLocationSchema);
module.exports = DockLocation;
