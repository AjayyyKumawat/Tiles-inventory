import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import { products } from '../src/data/mockData.js';

dotenv.config();

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database Connected for Seeding');

    // 1. Clear out any existing products to prevent duplicates
    await Product.deleteMany();

    // 2. Map the frontend mock data to match our Mongoose schema
    // The frontend uses 'quantity' but our schema uses 'stock'
    const formattedProducts = products.map((item) => {
      return {
        sku: item.sku,
        name: item.name,
        brand: item.brand || 'Generic',
        category: item.category,
        unit: item.unit,
        stock: item.quantity, 
        reorderPoint: item.reorderPoint,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        status: item.status
      };
    });

    // 3. Insert into MongoDB
    await Product.insertMany(formattedProducts);
    
    console.log('✅ Mock Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error importing data: ${error.message}`);
    process.exit(1);
  }
};

importData();
