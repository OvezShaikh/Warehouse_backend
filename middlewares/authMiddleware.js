  const jwt = require('jsonwebtoken');
  const User = require('../models/User');

  const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      // Verify token and decode payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user in the database by the decoded user ID
      const user = await User.findById(decoded.id);  // Make sure 'id' is used here, matching your token structure
      console.log("Decoded userid",decoded.id)

      // If no user is found or user is disabled, deny access
      if (!user || !user.isLoggedIn) {
        return res.status(401).json({ message: 'User not logged in or token expired' });
      }

      // Attach the user object to the request to make it accessible in the route handler
      req.user = user;
      // Proceed to the next middleware or route handler
      next();
    } catch (err) {
      // Handle token errors (invalid, expired, etc.)
      if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Any other errors
      console.error('Token verification error:', err);
      res.status(500).json({ message: 'Token verification error' });
    }
  };

  module.exports = authMiddleware;
