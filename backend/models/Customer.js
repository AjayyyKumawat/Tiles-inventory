import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: 'India' },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
