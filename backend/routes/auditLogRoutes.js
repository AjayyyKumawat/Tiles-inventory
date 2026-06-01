import express from 'express';
import { getDbModels } from '../middleware/dbSelector.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { AuditLog } = getDbModels(req);
    const logs = await AuditLog.find({}).sort({ timestamp: -1 });
    res.json(logs.map((log) => ({ ...log.toObject(), id: log._id })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { AuditLog } = getDbModels(req);
    const saved = await new AuditLog(req.body).save();
    res.status(201).json({ ...saved.toObject(), id: saved._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
