import express from 'express';
import { getDbModels } from '../middleware/dbSelector.js';

const router = express.Router();

function toClientCustomer(customer) {
  return {
    ...customer.toObject(),
    id: customer._id,
  };
}

function buildCustomerCode() {
  return `CUST-${Date.now().toString().slice(-6)}`;
}

router.get('/', async (req, res) => {
  try {
    const { Customer } = getDbModels(req);
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    res.json(customers.map(toClientCustomer));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { Customer } = getDbModels(req);
    const payload = {
      ...req.body,
      customerCode: req.body.customerCode || buildCustomerCode(),
    };
    const customer = new Customer(payload);
    const savedCustomer = await customer.save();
    res.status(201).json(toClientCustomer(savedCustomer));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { Customer } = getDbModels(req);
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    res.json(toClientCustomer(updatedCustomer));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { Customer } = getDbModels(req);
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);

    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    res.json({ message: 'Customer removed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
