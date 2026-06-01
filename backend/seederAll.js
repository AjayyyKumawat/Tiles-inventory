import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Supplier from './models/Supplier.js';
import SalesOrder from './models/SalesOrder.js';
import User from './models/User.js';

dotenv.config();

const usersData = [
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
  },
];

const suppliersData = [
  { name: "Kajaria Ceramics Ltd.", tileType: "Vitrified, Wall Tiles", gst: "08AABCK1219Q1ZB", contactPerson: "Rajesh Sharma", phone: "+91 98100-12345", email: "orders@kajaria.com", orderedQty: 1200, paymentTerms: "30 Days Credit", status: "Active" },
  { name: "Somany Ceramics", tileType: "Floor Tiles, GVT", gst: "08AAFCS8095P1ZT", contactPerson: "Amit Verma", phone: "+91 97290-54321", email: "supply@somany.in", orderedQty: 800, paymentTerms: "Advance", status: "Active" },
  { name: "Orient Bell Ltd.", tileType: "Digital Tiles, Sanitaryware", gst: "07AAACO5601P1ZD", contactPerson: "Priya Nair", phone: "+91 99999-11111", email: "b2b@orientbell.com", orderedQty: 450, paymentTerms: "15 Days Credit", status: "Active" },
  { name: "RAK Ceramics India", tileType: "Porcelain, Large Format", gst: "24AABCR0123H1ZK", contactPerson: "Firoz Patel", phone: "+91 94260-77777", email: "india@rakceramics.com", orderedQty: 2500, paymentTerms: "60 Days Credit", status: "Active" },
  { name: "Nitco Tiles", tileType: "Marble Look, Premium", gst: "27AABCN4032L1ZN", contactPerson: "Suresh Kadam", phone: "+91 90000-55555", email: "wholesale@nitco.in", orderedQty: 0, paymentTerms: "Advance", status: "Review" },
  { name: "Sunhearrt Ceramics", tileType: "Outdoor, Anti-Skid", gst: "24AAICS3210E1ZQ", contactPerson: "Dinesh Bhai", phone: "+91 94270-33333", email: "sales@sunhearrt.com", orderedQty: 0, paymentTerms: "Advance", status: "Inactive" },
];

const salesOrdersData = [
  { customerName: "Ravi Sharma", contact: "9876543210", tileName: "Ivory Pearl GVT", category: "2×2 ft", qty: 50, total: 32500, date: "2026-04-20", status: "Delivered" },
  { customerName: "Sunita Patel", contact: "9123456789", tileName: "Carrara White Marble Look", category: "2×2 ft", qty: 30, total: 26700, date: "2026-04-22", status: "Shipped" },
  { customerName: "Arjun Mehta", contact: "9988776655", tileName: "Sahara Sand Slab", category: "2×4 ft", qty: 20, total: 25000, date: "2026-04-25", status: "Processing" },
  { customerName: "Deepa Krishnan", contact: "7812345678", tileName: "Onyx Black Polished", category: "2×4 ft", qty: 15, total: 22200, date: "2026-04-28", status: "Pending" },
  { customerName: "Mohammed Idrisi", contact: "8765432109", tileName: "Terracotta Floor Classic", category: "16×16 in", qty: 80, total: 23200, date: "2026-05-01", status: "Pending" },
  { customerName: "Kavita Joshi", contact: "9001234567", tileName: "Aqua Blue Ceramic Wall", category: "12×18 in", qty: 120, total: 23400, date: "2026-05-02", status: "Processing" },
];

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    await Supplier.deleteMany();
    await SalesOrder.deleteMany();
    await User.deleteMany();
    console.log('🗑️  Cleared existing suppliers, sales orders, and users');

    await Supplier.insertMany(suppliersData);
    console.log(`✅ ${suppliersData.length} Suppliers seeded`);

    await SalesOrder.insertMany(salesOrdersData);
    console.log(`✅ ${salesOrdersData.length} Sales Orders seeded`);

    // Use User.create to ensure password pre-save hooks are triggered
    await User.create(usersData);
    console.log(`✅ ${usersData.length} Users seeded`);

    console.log('🎉 All data seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

seedAll();
