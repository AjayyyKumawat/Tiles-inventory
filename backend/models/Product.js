import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, default: 'Generic' },
  category: { type: String, required: true },
  unit: { type: String, default: 'pcs' },
  stock: { type: Number, required: true, default: 0 },
  reorderPoint: { type: Number, default: 10 },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  status: { type: String, default: 'Active' }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields!
});

const Product = mongoose.model('Product', productSchema);
export default Product;
