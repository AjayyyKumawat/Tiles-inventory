import express from 'express';
import { getDbModels } from '../middleware/dbSelector.js';

const router = express.Router();

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const { Supplier } = getDbModels(req);
    const suppliers = await Supplier.find({});
    res.json(suppliers.map(s => ({ ...s.toObject(), id: s._id })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create supplier
router.post('/', async (req, res) => {
  try {
    const { Supplier } = getDbModels(req);
    const s = new Supplier(req.body);
    const saved = await s.save();
    res.status(201).json({ ...saved.toObject(), id: saved._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
  try {
    const { Supplier } = getDbModels(req);
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...updated.toObject(), id: updated._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE supplier
router.delete('/:id', async (req, res) => {
  try {
    const { Supplier } = getDbModels(req);
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ message: 'Supplier removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
