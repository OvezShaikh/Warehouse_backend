// routes/dockLocationRoutes.js
const express = require('express');
const DockLocation = require('../models/DockLocation');
const router = express.Router();

// Create a new dock location
router.post('/', async (req, res) => {
    const { dockCode, capacity, description, locationCode  } = req.body;

    // Check for existing location code
    try {
        const existingLocation = await DockLocation.findOne({ locationCode }); // Ensure you're checking for dockCode if that's your unique key
        if (existingLocation) {
            return res.status(400).json({ message: "Location code already exists." });
        }

        console.log('Received data:', req.body); // Log incoming data

        const newLocation = new DockLocation({ dockCode, capacity, description , locationCode});
        await newLocation.save();
        res.status(201).json(newLocation);
    } catch (error) {
        console.error('Error adding location:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all dock locations
router.get('/', async (req, res) => {
    try {
        const dockLocations = await DockLocation.find();
        res.status(200).json(dockLocations); // Respond with all dock locations
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a dock location by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDockLocation = await DockLocation.findByIdAndDelete(id);
        if (!deletedDockLocation) {
            return res.status(404).json({ message: 'Dock location not found' });
        }
        res.status(200).json({ message: 'Dock location deleted successfully', id: deletedDockLocation._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
