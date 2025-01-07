const mongoose = require('mongoose');

const MasterListSchema = new mongoose.Schema({
  itemNo: { type: String, required: true }
});

module.exports = mongoose.model('MasterList', MasterListSchema);
