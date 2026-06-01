import mongoose from 'mongoose';

const salesOrderSchema = new mongoose.Schema({
  orderId: { type: Number, unique: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  customerName: { type: String, required: true },
  contact: { type: String, default: '' },
  tileName: { type: String, default: '' },
  category: { type: String, default: '' },
  qty: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  date: { type: String, default: '' },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Processing', 'Shipped', 'Delivered'] },
}, { timestamps: true });

const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
export default SalesOrder;
