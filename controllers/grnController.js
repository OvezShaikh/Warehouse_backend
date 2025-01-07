// controllers/grnController.js

const GRN = require('../models/grnModel'); // Import the GRN model
const DockLocation = require('../models/DockLocation');

const updateDockLocation = async (req, res) => {
  const { id } = req.params;
  const { dockLocation, items } = req.body;

  try {
    // Update the dock location for each item in the GRN
    const grn = await GRN.findById(id);
    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    // Update each item’s dockCode
    grn.items.forEach(item => {
      if (items.some(updatedItem => updatedItem._id.toString() === item._id.toString())) {
        item.dockCode = dockLocation; // Update dockCode for the item
      }
    });

    // Save the updated GRN
    await grn.save();
    res.status(200).json(grn);
  } catch (error) {
    console.error("Error updating dock location:", error);
    res.status(500).json({ message: "Error updating dock location", error });
  }
};

// Controller to handle creating a new GRN
exports.createGRN = async (req, res) => {
  const { poNumber, receivingNo, items, location, status } = req.body;

  // Basic validation to check for required fields
  if (!poNumber || !receivingNo || !Array.isArray(items) || items.length === 0) {
    console.log("Debug Info: ", {
      poNumber: poNumber,
      receivingNo: receivingNo,
      items: items,
      itemsIsArray: Array.isArray(items),
      itemsLength: items ? items.length : 'undefined'
    });
    return res.status(400).json({ message: "Missing required fields or invalid items array." });
  }

  try {
    const grnData = new GRN(req.body); // Create a new GRN from request body
    await grnData.save(); // Save GRN to the database
    res.status(201).json(grnData); // Respond with created GRN
  } catch (error) {
    console.error("Error creating GRN:", error);
    res.status(500).json({ message: "Error creating GRN", error });
  }
};

// Get all GRNs (with pagination and optional filters)
exports.getAllGRNs = async (req, res) => {
  const { status, poNumber, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (poNumber) filter.poNumber = { $regex: poNumber, $options: 'i' }; // Case-insensitive match

  try {
    const grns = await GRN.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const totalGrns = await GRN.countDocuments(filter);

    res.status(200).json({
      grns,
      total: totalGrns,
      page,
      totalPages: Math.ceil(totalGrns / limit),
    });
  } catch (error) {
    console.error("Error fetching GRNs:", error);
    res.status(500).json({ message: "Error fetching GRNs", error });
  }
};

exports.updateItemStatus = async (req, res) => {
  const { grnId, itemId } = req.params; // GRN ID and Item ID
  const { status, okQuantity, rejectedQuantity } = req.body; // New status and quantities

  // Validate status
  if (!['Pending', 'OK', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: "Invalid status. Allowed values are 'Pending', 'OK', or 'Rejected'." });
  }

  try {
    // Find the GRN
    const grn = await GRN.findById(grnId);
    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    // Locate the specific item
    const item = grn.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the status
    item.status = status; // Update item status

    // If okQuantity and rejectedQuantity are provided, update them directly
    if (typeof okQuantity === 'number') {
      item.okQuantity = okQuantity;
    }
    if (typeof rejectedQuantity === 'number') {
      item.rejectedQuantity = rejectedQuantity;
    }

    // Save the GRN
    await grn.save();

    // Recalculate the total okQuantity and rejectedQuantity for the entire GRN
    const updatedOkQuantity = grn.items.reduce((sum, item) => sum + item.okQuantity);
    const updatedRejectedQuantity = grn.items.reduce((sum, item) => sum + item.rejectedQuantity);

    // Update the GRN with the recalculated values
    grn.okQuantity = updatedOkQuantity;
    grn.rejectedQuantity = updatedRejectedQuantity;
    await grn.save();

    res.status(200).json({
      message: "Item status and quantities updated successfully",
      item,
    });
  } catch (error) {
    console.error("Error updating item status:", error);
    res.status(500).json({ message: "Error updating item status", error: error.message });
  }
};


const updateItem = async (req, res) => {
  try {
    const { grnId, itemId } = req.params;
    const updatedItem = await GRNModel.findOneAndUpdate(
      { _id: grnId, 'items._id': itemId },
      { $set: { 'items.$': req.body } },  // Update item details
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ message: 'Item or GRN not found' });
    }
    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Additional controller functions for handling other operations can go here...
