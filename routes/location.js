// routes/location.js
const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const GRN = require('../models/grnModel');

// POST: Create a new location
router.post('/', async (req, res) => {
  try {
    const { locationCode, capacity } = req.body;

    const newLocation = new Location({ locationCode, capacity });
    await newLocation.save();

    res.status(201).json(newLocation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET: Fetch all locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find();
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/locations', async (req, res) => {
  try {
    const locations = await Location.find().select('locationCode currentLoad capacity stock'); // Select only locationCode to send to frontend
    res.json(locations);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).send('Server error');
  }
});

router.patch('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body; // The new stock value (can also be incremented or decremented)
    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { stock },
      { new: true } // Return the updated document
    );
    if (!updatedLocation) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.status(200).json(updatedLocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.patch('/:id/products', async (req, res) => {
  const { id } = req.params;
  const { productId, quantity } = req.body;

  if (!productId || typeof quantity !== 'number' || isNaN(quantity)) {
    return res.status(400).json({ message: 'Invalid product or quantity' });
  }

  try {
    const location = await Location.findById(id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const productIndex = location.products.findIndex(
      (prod) => prod.productId.toString() === productId.toString()
    );

    if (productIndex === -1) {
      location.products.push({ productId, quantity });
    } else {
      location.products[productIndex].quantity = quantity;
    }

    await location.save();

    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




// PATCH: Update item location in a GRN
router.patch('/update-location', async (req, res) => {
  const { grnId, items } = req.body;
  console.log('Received Payload:', req.body);
  
  if (!grnId || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Missing required fields: grnId or itemLocations' });
  }

  try {
    // Fetch the GRN by ID
    const grn = await GRN.findById(grnId);
    if (!grn) {
      return res.status(404).json({ message: 'GRN not found' });
    }

    // Process each item in itemLocations using Promise.all for parallel processing
    const locationUpdates = items.map(async ({ itemId, newLocation, locationCode, dockCode, capacity, currentLoad }) => {
      // Find the item in the GRN
      const item = grn.items.id(itemId);
      if (!item) {
        console.warn(`Item with ID ${itemId} not found in GRN ${grnId}`);
        return null; // Skip to the next item if not found
      }

      // Find the corresponding location using locationCode
      const location = await Location.findOne({ locationCode });
      if (!location) {
        console.warn(`Location with code ${locationCode} not found.`);
        return null; // Skip to the next item if location is not found
      }

      // Update location's capacity and current load based on the provided values
      location.capacity = capacity;
      location.currentLoad = currentLoad;
      await location.save();

      // Update the item's dockLocation in the GRN with the new location code
      item.dockLocation = newLocation;
      item.dockCode = newLocation;

      return { itemId: item._id, locationCode: location.locationCode, newLocation, dockCode };
    });

    // Wait for all location updates to complete
    await Promise.all(locationUpdates);

    // Save the GRN after all item locations have been updated
    await grn.save();
    
    res.status(200).json({ message: 'Location and dockCode updated updated successfully', updatedItems: items });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
});



// PATCH: Update location capacity
router.patch('/:id/capacity', async (req, res) => {
  try {
    const { id } = req.params;
    const { capacity } = req.body; // The new capacity value (can be incremented or decremented)
    
    if (capacity === undefined || isNaN(capacity)) {
      return res.status(400).json({ message: "Invalid capacity value" });
    }

    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { capacity },
      { new: true } // Return the updated document
    );

    if (!updatedLocation) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.status(200).json(updatedLocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
