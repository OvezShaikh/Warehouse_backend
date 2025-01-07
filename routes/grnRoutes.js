const express = require('express');
const mongoose = require('mongoose');
const GRN = require('../models/grnModel'); // Adjust the path as needed
const grnController = require('../controllers/grnController');
// const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();
const MasterList = require('../models/MasterList'); 

// Create a new GRN
router.post('/', async (req, res) => {
  const { poNumber, receivingNo, items, location, status } = req.body;

  // Basic validation to check for required fields
  if (!poNumber || !receivingNo || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Missing required fields or invalid items array." });
  }

  try {
     // Loop through each item in the items array and validate if itemNo exists in the MasterList
     for (let item of items) {
      const isValidItem = await MasterList.exists({ itemNo: item.itemNo });
      
      if (!isValidItem) {
        return res.status(400).json({ message: `Invalid itemNo: ${item.itemNo}. It does not exist in the Master List.` });
      }
    }
    
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
    const totalGrns = await GRN.countDocuments(filter);

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

// Route to update item status and quantity (okQuantity, rejectedQuantity)
router.patch('/:grnId/item/:itemId/status', async (req, res) => {
  try {
    const { grnId, itemId } = req.params;
    const { status, okQuantity, rejectedQuantity } = req.body;

    // Validate status (ensure it's one of the allowed values)
    const validStatuses = ['Pending', 'OK', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Validate okQuantity and rejectedQuantity (cannot exceed itemQuantity)
    const grn = await GRN.findById(grnId);
    if (!grn) {
      return res.status(404).json({ message: 'GRN not found' });
    }

    const item = grn.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Calculate the total quantity
    const totalQuantity = (okQuantity || 0) + (rejectedQuantity || 0);
    if (totalQuantity > item.quantity) {
      return res.status(400).json({ message: 'Total OK and Rejected quantities cannot exceed Item Quantity.' });
    }

    // Update the item with the new status and quantities
    item.status = status;
    item.okQuantity = okQuantity || item.okQuantity;
    item.rejectedQuantity = rejectedQuantity || item.rejectedQuantity;

    // Save the updated GRN
    await grn.save();

    res.status(200).json(grn);
  } catch (error) {
    console.error("Error updating item status:", error);
    res.status(500).json({ message: "Error updating item status", error });
  }
});


// Route to update the item of a specific GRN by item ID
router.patch('/:grnId/item/:itemId', async (req, res) => {
  try {
    const { grnId, itemId } = req.params;
    const { okQuantity, rejectedQuantity, currentQuantity} = req.body;  // Expect either of these in the request body

    // Validate that at least one of the quantities is provided
    if (okQuantity === undefined && rejectedQuantity === undefined && currentQuantity === undefined) {
      return res.status(400).json({ message: "Either okQuantity, rejectedQuantity, or currentQuantity must be provided." });
    }

    // Find the GRN document
    const grn = await GRN.findById(grnId);
    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    // Find the item within the GRN
    const item = grn.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the quantities based on what was provided in the request
    if (okQuantity !== undefined) {
      item.okQuantity = okQuantity;
    }
    if (rejectedQuantity !== undefined) {
      item.rejectedQuantity = rejectedQuantity;
    }
    if (currentQuantity !== undefined) {
      item.currentQuantity = currentQuantity;  // Update the currentQuantity field
    }

    // Save the updated GRN document
    await grn.save();

    // Recalculate okQuantity and rejectedQuantity for the entire GRN (optional)
    const updatedOkQuantity = grn.items.reduce((sum, item) => sum + (item.okQuantity));
    const updatedRejectedQuantity = grn.items.reduce((sum, item) => sum + (item.rejectedQuantity));

    grn.okQuantity = updatedOkQuantity;
    grn.rejectedQuantity = updatedRejectedQuantity;

    // Save the updated GRN with recalculated totals
    await grn.save();

    res.status(200).json(grn);  // Respond with the updated GRN document
  } catch (error) {
    console.error("Error updating item quantities:", error);
    res.status(500).json({ message: "Error updating item quantities", error });
  }
});



// Update status for a specific quantity within an item
// router.patch('/:grnId/item/:itemId/quantity/:quantityIndex/status', async (req, res) => {
//   const { grnId, itemId, quantityIndex } = req.params;
//   const { status } = req.body;

//   // Validate status
//   if (!['Pending', 'OK', 'Rejected'].includes(status)) {
//     return res.status(400).json({ message: "Invalid status. Allowed values are 'Pending', 'OK', or 'Rejected'." });
//   }

//   try {
//     // Update only the specific quantity's status
//     const grn = await GRN.findOneAndUpdate(
//       { _id: grnId, 'items._id': itemId },
//       { $set: { [`items.$.quantities.${quantityIndex}.status`]: status } }, // Update the specific quantity's status

//       { new: true }
//     );

//     if (!grn) {
//       return res.status(404).json({ message: "GRN or Item not found" });
//     }

//     const updatedItem = grn.items.find((item) => item._id.toString() === itemId);
//     res.status(200).json({
//       message: "Quantity status updated successfully",
//       updatedQuantity: updatedItem?.quantities?.[quantityIndex],
//     });
//     } catch (error) {
//     console.error("Error updating quantity status:", error);
//     res.status(500).json({ message: "Error updating quantity status", error: error.message });
//   }
// });


// Get all quantities and their statuses for a specific item
// router.get('/:grnId/item/:itemId/quantity', async (req, res) => {
//   const { grnId, itemId } = req.params;

//   try {
//     const grn = await GRN.findOne(
//       { _id: grnId, 'items._id': itemId },
//       { 'items.$': 1 } // Fetch only the specific item
//     );

//     if (!grn || !grn.items.length) {
//       return res.status(404).json({ message: "GRN or Item not found" });
//     }

//     res.status(200).json(grn.items[0].quantities);
//   } catch (error) {
//     console.error("Error fetching quantities:", error);
//     res.status(500).json({ message: "Error fetching quantities", error: error.message });
//   }
// });


module.exports = router;
