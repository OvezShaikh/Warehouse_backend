const express = require('express');
const multer = require('multer');
const router = express.Router();
const MasterList = require('../models/MasterList');
const XLSX = require('xlsx');

const upload = multer({ storage: multer.memoryStorage() }); // For Excel file uploads

// Admin uploads the Master List
router.post('/upload-master-list', upload.single('file'), async (req, res) => {
    try {
      const buffer = req.file.buffer;
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const masterListData = XLSX.utils.sheet_to_json(sheet);
  
      const itemNos = masterListData.map(row => row.itemNo);
  
      await MasterList.deleteMany();
      await MasterList.insertMany(itemNos.map(item => ({ itemNo: item })));
  
      res.status(200).json({ message: 'Master list uploaded successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to upload master list' });
    }
  });

  // Add a new item manually to the Master List
router.post('/add-item', async (req, res) => {
    try {
        const { itemNo } = req.body;

        if (!itemNo || !itemNo.trim()) {
            return res.status(400).json({ message: 'Item number is required' });
        }

        // Check if the item already exists in the master list
        const existingItem = await MasterList.findOne({ itemNo });

        if (existingItem) {
            return res.status(400).json({ message: 'Item number already exists in the master list' });
        }

        // Add the new item to the master list
        const newItem = new MasterList({ itemNo });
        await newItem.save();

        res.status(201).json({ message: 'Item added successfully', item: newItem });
    } catch (error) {
        console.error('Failed to add item:', error);
        res.status(500).json({ message: 'Failed to add item' });
    }
});

  
router.get('/', async (req, res) => {
  try {
    const itemNos = await MasterList.find({}, 'itemNo');
    res.status(200).json({ itemNos: itemNos.map(item => item.itemNo) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch item numbers' });
  }
});

module.exports = router;
