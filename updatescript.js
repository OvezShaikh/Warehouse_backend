const mongoose = require('mongoose');
const fs = require('fs'); // Required for reading JSON files
const GRN = require('./models/grnModel'); // Import the GRN model

// Load the price mapping JSON file
const priceMapping = JSON.parse(fs.readFileSync('./prices.json', 'utf-8'));

// Connect to your MongoDB database
mongoose.connect('mongodb://localhost:27017/warehouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    // Fetch all GRNs from the database
    const grns = await GRN.find();

    // Prepare a bulkWrite operation
    const bulkOps = [];

    // Iterate over each GRN
    grns.forEach(grn => {
      // Iterate over each item in the GRN
      grn.items.forEach((item) => {
        // Find the price in the priceMapping based on the item's "itemNo"
        const newAmount = priceMapping.find(price => price['Item No.'] === item.itemNo)?.Amount;

        if (newAmount) {
          // Convert the amount from string (if it's in a comma-separated format) to a number
          const formattedAmount = parseFloat(newAmount.replace(/,/g, ''));

          // Add a bulk update operation for each item
          bulkOps.push({
            updateOne: {
              filter: { _id: grn._id, 'items._id': item._id }, // Match the specific item in the GRN
              update: {
                $set: { 'items.$.amount': formattedAmount }, // Set the amount for that specific item
              },
            },
          });
        }
      });
    });

    if (bulkOps.length > 0) {
      // Execute the bulk operations
      const result = await GRN.bulkWrite(bulkOps);
      console.log('Bulk update result:', result);
    } else {
      console.log('No items to update.');
    }

    // Delete the price mapping file as this is a one-time update
    fs.unlinkSync('./prices.json');
    console.log('Price mapping file deleted.');

    // Disconnect from the database after the operation
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });
