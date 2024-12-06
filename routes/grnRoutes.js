const express = require('express');
const mongoose = require('mongoose');
const GRN = require('../models/grnModel'); // Adjust the path as needed
const grnController = require('../controllers/grnController');
// const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Create a new GRN
router.post('/', async (req, res) => {
  const { poNumber, receivingNo, items, location, status } = req.body;

  // Basic validation to check for required fields
  if (!poNumber || !receivingNo || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing required fields or invalid items array." });
  }

  try {
    const grnData = new GRN(req.body);
    await grnData.save();
    res.status(201).json(grnData);
  } catch (error) {
    console.error("Error creating GRN:", error);
    res.status(500).json({ message: "Error creating GRN", error });
  }
});

// Get all GRNs with optional filtering and pagination
router.get('/', async (req, res) => {
  const { status, poNumber } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (poNumber) filter.poNumber = { $regex: poNumber, $options: 'i' }; // Case-insensitive match

  try {
    const grns = await GRN.find(filter)
    

    res.status(200).json({
      grns,
      total: totalGrns,
    });
  } catch (error) {
    console.error("Error fetching GRNs:", error);
    res.status(500).json({ message: "Error fetching GRNs", error });
  }
});

// Get a GRN by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid GRN ID format." });
  }

  try {
    const grn = await GRN.findById(id);
    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }
    res.status(200).json(grn);
  } catch (error) {
    console.error("Error fetching GRN:", error);
    res.status(500).json({ message: "Error fetching GRN", error });
  }
});

// Update a GRN by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, location, items } = req.body;

  // Validate incoming data
  if (status && !['OK', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: "Invalid status. Allowed values are 'OK' or 'Rejected'." });
  }

  // Validate location and items (you can add more validation here if needed)
  if (location && typeof location !== 'string') {
    return res.status(400).json({ message: "Invalid location value." });
  }

  try {
    const updatedGrn = await GRN.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedGrn) {
      return res.status(404).json({ message: "GRN not found" });
    }
    res.status(200).json(updatedGrn);
  } catch (error) {
    console.error("Error updating GRN:", error);
    res.status(500).json({ message: "Error updating GRN", error });
  }
});

// Delete a GRN by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid GRN ID format." });
  }

  try {
    const deletedGrn = await GRN.findByIdAndDelete(id);
    if (!deletedGrn) {
      return res.status(404).json({ message: "GRN not found" });
    }
    res.status(200).json({ message: "GRN deleted successfully", deletedGrn });
  } catch (error) {
    console.error("Error deleting GRN:", error);
    res.status(500).json({ message: "Error deleting GRN", error });
  }
});

// Update only the location of a GRN by ID
router.patch('/:id/location', async (req, res) => {
  const { id } = req.params;
  const { dockLocation } = req.body;

  // Validate location
  if (!dockLocation || typeof dockLocation !== 'string') {
    return res.status(400).json({ message: "Invalid dock location value." });
  }

  try {
    const updatedGrn = await GRN.findByIdAndUpdate(id, { dockLocation }, { new: true });
    if (!updatedGrn) {
      return res.status(404).json({ message: "GRN not found" });
    }
    res.status(200).json(updatedGrn);
  } catch (error) {
    console.error("Error updating dock location:", error);
    res.status(500).json({ message: "Error updating dock location", error });
  }
});

router.delete('/:grnId/item/:itemNo', async (req, res) => {
  const { grnId, itemNo } = req.params;

  try {
    // Find the GRN document by ID
    const grn = await GRN.findById(grnId);
    if (!grn) {
      return res.status(404).json({ message: `GRN with ID ${grnId} not found.` });
    }

    // Find the index of the item in the items array
    const itemIndex = grn.items.findIndex(item => item.itemNo === itemNo);

    if (itemIndex === -1) {
      return res.status(404).json({ message: `Item with itemNo ${itemNo} not found in GRN ${grnId}.` });
    }

    // Remove the item from the items array
    grn.items.splice(itemIndex, 1);

    // Save the updated GRN
    await grn.save();

    res.status(200).json({ message: `Item with itemNo ${itemNo} deleted successfully from GRN ${grnId}.` });
  } catch (error) {
    console.error("Error deleting GRN item:", error);
    res.status(500).json({ message: "Failed to delete item. Please check the error.", error: error.message });
  }
});

router.patch('/grn/:grnId/item/:itemId/location', async (req, res) => {
  try {
    const { grnId, itemId } = req.params;
    const { dockLocation, status } = req.body;

    const grn = await GRN.findById(grnId);
    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    // Find the item and update its location and status
    const item = grn.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.dockLocation = dockLocation || item.dockLocation;
    item.status = status || item.status;

    await grn.save();  // Save the updated GRN document
    res.status(200).json(grn);
  } catch (error) {
    res.status(500).json({ message: "Error updating item location", error });
  }
});

// Update GRN status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedGrn = await GRN.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedGrn) {
      return res.status(404).json({ message: "GRN not found" });
    }
    res.status(200).json(updatedGrn);
  } catch (error) {
    res.status(500).json({ message: "Error updating GRN status", error });
  }
});

router.patch('/:grnId/item/:itemId/status', async (req, res) => {
  try {
    const { grnId, itemId } = req.params; // GRN ID and Item ID
    const { status } = req.body; // New status for the item

    // Find GRN by ID and update the specific item's status
    const updatedGrn = await GRN.findOneAndUpdate(
      { _id: grnId, 'items._id': itemId }, // Locate GRN and specific item
      { $set: { 'items.$.status': status } }, // Update item's status
      { new: true } // Return the updated document
    );

    if (!updatedGrn) {
      return res.status(404).json({ message: 'GRN or Item not found' });
    }

    res.status(200).json(updatedGrn);
  } catch (error) {
    res.status(500).json({ message: 'Error updating item status', error });
  }
});


module.exports = router;
