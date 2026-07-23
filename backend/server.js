/* global process */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import productRoutes from './routes/productRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import salesOrderRoutes from './routes/salesOrderRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import SalesOrder from './models/SalesOrder.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Supplier from './models/Supplier.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors()); // Allow requests from the React frontend
app.use(express.json()); // Allow parsing of JSON request bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/customers', customerRoutes);

// Basic Test Route
app.get('/', (req, res) => {
  res.send('Inventory Management API is running...');
});

// Database Connection
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
  console.warn('⚠️ MONGODB_URI is not defined. Skip database connection.');
} else {
  mongoose.connect(dbURI)
    .then(async () => {
      console.log('✅ Connected to MongoDB Atlas successfully!');
      
      if (process.env.SEED_DB === 'true') {
        // Run sales order ID migration for any existing records missing orderId
        try {
          const ordersWithoutId = await SalesOrder.find({
            $or: [
              { orderId: { $exists: false } },
              { orderId: null }
            ]
          }).sort({ createdAt: 1 });
          
          if (ordersWithoutId.length > 0) {
            console.log(`Running migration: Assigning orderId to ${ordersWithoutId.length} orders...`);
            const lastOrder = await SalesOrder.findOne({
              orderId: { $exists: true, $ne: null }
            }, {}, { sort: { orderId: -1 } });
            let currentId = lastOrder && lastOrder.orderId ? lastOrder.orderId : 0;
            
            for (const order of ordersWithoutId) {
              currentId += 1;
              order.orderId = currentId;
              await order.save();
            }
            console.log('Migration completed successfully!');
          }
        } catch (err) {
          console.error('Error running SalesOrder ID migration:', err.message);
        }

        // Seed/update demo credentials on startup
        try {
          // Admin/Owner
          let adminUser = await User.findOne({ role: 'owner' });
          if (!adminUser) {
            adminUser = await User.findOne({ email: 'admin@gmail.com' });
          }
          if (!adminUser) {
            await User.create({
              name: 'Ajay Kumawat',
              email: 'admin@gmail.com',
              password: 'admin123',
              role: 'owner',
              avatar: 'AK',
              company: 'Hansa Marble',
            });
          }

          // Staff
          let staffUser = await User.findOne({ email: 'staff@company.com' });
          if (!staffUser) {
            await User.create({
              name: 'Priya Sharma',
              email: 'staff@company.com',
              password: 'password123',
              role: 'staff',
              avatar: 'PS',
              company: 'Hansa Marble',
            });
          }
          console.log('✅ Demo credentials synced successfully!');
        } catch (err) {
          console.error('Error syncing demo credentials:', err.message);
        }

        // Seed demo database if it's empty
        try {
          const demoDb = mongoose.connection.useDb('demo_inventory_db', { useCache: true });
          const DemoProduct = demoDb.model('Product', Product.schema);
          const DemoSupplier = demoDb.model('Supplier', Supplier.schema);
          const DemoSalesOrder = demoDb.model('SalesOrder', SalesOrder.schema);
          const DemoUser = demoDb.model('User', User.schema);

          const productCount = await DemoProduct.countDocuments({});
          if (productCount === 0) {
            console.log('Seeding demo database because it is empty...');
            
            // Seed Products
            const createdProducts = await DemoProduct.insertMany([
              { sku: 'TIL-DEMO-01', name: 'Ivory Marble GVT', brand: 'Kajaria', category: '2×2 ft', stock: 120, reorderPoint: 20, costPrice: 320, sellingPrice: 550 },
              { sku: 'TIL-DEMO-02', name: 'Carrara White Marble', brand: 'Somany', category: '2×4 ft', stock: 80, reorderPoint: 15, costPrice: 450, sellingPrice: 890 },
              { sku: 'TIL-DEMO-03', name: 'Onyx Black Polished', brand: 'Orient Bell', category: '2×4 ft', stock: 45, reorderPoint: 15, costPrice: 520, sellingPrice: 950 },
              { sku: 'TIL-DEMO-04', name: 'Sahara Sand Rustic', brand: 'Generic', category: '16×16 in', stock: 300, reorderPoint: 50, costPrice: 180, sellingPrice: 290 },
              { sku: 'TIL-DEMO-05', name: 'Royal Blue Ceramic', brand: 'Sunhearrt', category: '12×18 in', stock: 15, reorderPoint: 30, costPrice: 210, sellingPrice: 380 },
            ]);

            // Seed Suppliers
            await DemoSupplier.insertMany([
              { name: "Kajaria Ceramics Ltd.", tileType: "Vitrified, Wall Tiles", gst: "08AABCK1219Q1ZB", contactPerson: "Rajesh Sharma", phone: "+91 98100-12345", email: "orders@kajaria.com", orderedQty: 1200, paymentTerms: "30 Days Credit", status: "Active" },
              { name: "Somany Ceramics", tileType: "Floor Tiles, GVT", gst: "08AAFCS8095P1ZT", contactPerson: "Amit Verma", phone: "+91 97290-54321", email: "supply@somany.in", orderedQty: 800, paymentTerms: "Advance", status: "Active" },
            ]);

            // Seed Sales Orders
            const p1 = createdProducts[0];
            const p2 = createdProducts[1];
            const p4 = createdProducts[3];

            await DemoSalesOrder.insertMany([
              { orderId: 1, productId: p1._id, customerName: "Ravi Sharma", contact: "9876543210", tileName: p1.name, category: p1.category, qty: 50, total: 27500, date: "2026-05-20", status: "Delivered" },
              { orderId: 2, productId: p2._id, customerName: "Sunita Patel", contact: "9123456789", tileName: p2.name, category: p2.category, qty: 20, total: 17800, date: "2026-05-22", status: "Shipped" },
              { orderId: 3, productId: p4._id, customerName: "Arjun Mehta", contact: "9988776655", tileName: p4.name, category: p4.category, qty: 60, total: 17400, date: "2026-05-25", status: "Pending" },
            ]);
            
            console.log('✅ Demo database seeded successfully!');
          }

          const userCount = await DemoUser.countDocuments({});
          if (userCount === 0) {
            await DemoUser.create([
              {
                name: 'Ajay Kumawat',
                email: 'admin@gmail.com',
                password: 'admin123',
                role: 'owner',
                avatar: 'AK',
                company: 'Hansa Marble',
              },
              {
                name: 'Priya Sharma',
                email: 'staff@company.com',
                password: 'password123',
                role: 'staff',
                avatar: 'PS',
                company: 'Hansa Marble',
              }
            ]);
            console.log('✅ Demo users seeded successfully!');
          }
        } catch (err) {
          console.error('Error seeding demo database:', err.message);
        }
      }
    })
    .catch((error) => {
      console.error('❌ Error connecting to MongoDB:', error.message);
    });
}

const PORT = process.env.PORT || 5000;

// Only listen if not imported in a serverless environment (like Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
