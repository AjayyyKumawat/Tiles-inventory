import express from 'express';
import { getDbModels } from '../middleware/dbSelector.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

function toClientUser(user) {
  const obj = user.toObject();
  return {
    ...obj,
    id: obj._id,
  };
}

// Ensure all routes in this router are authenticated
router.use(protect);

// GET /me - Get details of currently logged-in user
router.get('/me', async (req, res) => {
  try {
    res.json({
      status: 'success',
      user: toClientUser(req.user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /me - Update own profile (any authenticated user)
router.put('/me', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const { User } = getDbModels(req);
    const userToUpdate = await User.findById(req.user._id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) {
      userToUpdate.name = name.trim();
      userToUpdate.avatar = name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'US';
    }
    if (email) {
      const duplicate = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: req.user._id } });
      if (duplicate) {
        return res.status(400).json({ message: 'This email is already taken by another account.' });
      }
      userToUpdate.email = email.toLowerCase().trim();
    }
    if (phone !== undefined) {
      userToUpdate.phone = phone.trim();
    }

    const savedUser = await userToUpdate.save();
    res.json({ status: 'success', user: toClientUser(savedUser) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Protect directory manipulation: Owner and Admin only
router.use(restrictTo('owner', 'admin'));

// GET / - List all users
router.get('/', async (req, res) => {
  try {
    const { User } = getDbModels(req);
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users.map(toClientUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST / - Create/assign a new staff or admin
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const { User } = getDbModels(req);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role,
      avatar: initials || 'US',
    });

    res.status(201).json(toClientUser(newUser));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /:id - Modify user details
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const { User } = getDbModels(req);
    
    // Self guards are also enforced in the middleware if required, but let's check
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update details
    if (name) {
      userToUpdate.name = name;
      userToUpdate.avatar = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'US';
    }
    if (email) {
      // Check duplicate email
      const duplicate = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: req.params.id } });
      if (duplicate) {
        return res.status(400).json({ message: 'This email is already taken by another account.' });
      }
      userToUpdate.email = email.toLowerCase().trim();
    }
    if (role) {
      // Self role modification guard
      if (userToUpdate._id.toString() === req.user._id.toString() && role !== req.user.role) {
        return res.status(400).json({ message: 'Self-Safety Guard: You cannot demote or change your own role.' });
      }
      userToUpdate.role = role;
    }
    if (password) {
      userToUpdate.password = password; // pre-save will automatically encrypt this!
    }

    const savedUser = await userToUpdate.save();
    res.json(toClientUser(savedUser));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /:id - Revoke user access
router.delete('/:id', async (req, res) => {
  try {
    const { User } = getDbModels(req);
    // Self deletion guard
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Self-Safety Guard: You cannot delete your own active session.' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User access successfully revoked.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
