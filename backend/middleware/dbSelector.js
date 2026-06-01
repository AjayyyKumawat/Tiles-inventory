import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import SalesOrder from '../models/SalesOrder.js';
import AuditLog from '../models/AuditLog.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';

export const getDbModels = (req) => {
  // Check if authenticated user is a demo credentials login
  const isDemo = req.user && (req.user.email === 'admin@gmail.com' || req.user.email === 'staff@company.com');
  const dbName = isDemo ? 'demo_inventory_db' : 'inventory_db';
  
  // Connect dynamically to the database using the cached connection cache
  const db = mongoose.connection.useDb(dbName, { useCache: true });
  
  return {
    Product: db.model('Product', Product.schema),
    Supplier: db.model('Supplier', Supplier.schema),
    SalesOrder: db.model('SalesOrder', SalesOrder.schema),
    AuditLog: db.model('AuditLog', AuditLog.schema),
    Customer: db.model('Customer', Customer.schema),
    User: db.model('User', User.schema),
  };
};
