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

// Additional controller functions for handling other operations can go here...
