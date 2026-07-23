import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // Load user and explicitly request password field
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Fallback: Check in the demo database
      const demoDb = mongoose.connection.useDb('demo_inventory_db', { useCache: true });
      const DemoUser = demoDb.models.User || demoDb.model('User', User.schema);
      user = await DemoUser.findOne({ email }).select('+password');
    }

    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user._id, user.role);

    // Hide password in output
    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({
      status: 'success',
      token,
      user: {
        ...safeUser,
        id: safeUser._id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
