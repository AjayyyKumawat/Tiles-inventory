import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tileType: { type: String, default: 'Vitrified Tiles' },
  gst: { type: String, default: '' },
  contactPerson: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  orderedQty: { type: Number, default: 0 },
  paymentTerms: { type: String, default: '30 Days Credit' },
  status: { type: String, default: 'Active', enum: ['Active', 'Review', 'Inactive'] },
}, { timestamps: true });

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;
