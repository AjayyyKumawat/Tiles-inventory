import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import suppliersReducer from './slices/suppliersSlice';
import salesOrdersReducer from './slices/salesOrdersSlice';
import customersReducer from './slices/customersSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    suppliers: suppliersReducer,
    salesOrders: salesOrdersReducer,
    customers: customersReducer,
  },
});
