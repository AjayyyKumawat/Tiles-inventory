import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Read JWT from Authorization header
    if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'You are not logged in. Access denied.' });
    }

    // Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user belonging to token
    let currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      // Fallback: Check in the demo database
      const demoDb = mongoose.connection.useDb('demo_inventory_db', { useCache: true });
      const DemoUser = demoDb.model('User');
      currentUser = await DemoUser.findById(decoded.id);
    }

    if (!currentUser) {
      return res.status(401).json({ message: 'The user belonging to this session no longer exists.' });
    }

    // Set user context
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Role guard helper
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Forbidden. Your role does not have authorization for this action.',
      });
    }
    next();
  };
};
