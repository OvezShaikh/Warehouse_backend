// roleMiddleware.js
const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied, admin only' });
    }
    next();
  } catch (err) {
    console.error('Error checking user role:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { isAdmin };
