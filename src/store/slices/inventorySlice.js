import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

const normalizeProduct = (product) => ({
  ...product,
  id: product._id || product.id,
  cost: product.cost ?? product.costPrice,
  price: product.price ?? product.sellingPrice,
});

// Async Thunks
export const fetchProducts = createAsyncThunk('inventory/fetchProducts', async () => {
  const response = await api.get('/products');
  return response.data.map(normalizeProduct);
});

export const addProductThunk = createAsyncThunk('inventory/addProduct', async (productData) => {
  const response = await api.post('/products', productData);
  return normalizeProduct(response.data);
});

export const fetchAuditLogs = createAsyncThunk('inventory/fetchAuditLogs', async () => {
  const response = await api.get('/audit-logs');
  return response.data.map((log) => ({
    ...log,
    id: log._id || log.id,
    timestamp: log.timestamp || log.createdAt,
  }));
});

export const createAuditLog = createAsyncThunk('inventory/createAuditLog', async (auditLog) => {
  const response = await api.post('/audit-logs', auditLog);
  return {
    ...response.data,
    id: response.data._id || response.data.id,
    timestamp: response.data.timestamp || response.data.createdAt,
  };
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    products: [], // Starts empty, will be filled by backend
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    auditLogs: [],
    auditStatus: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Add Product
      .addCase(addProductThunk.fulfilled, (state, action) => {
        state.products.unshift(action.payload);
      })
      // Fetch Audit Logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.auditStatus = 'loading';
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.auditStatus = 'succeeded';
        state.auditLogs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.auditStatus = 'failed';
        state.error = action.error.message;
      })
      // Create Audit Log
      .addCase(createAuditLog.fulfilled, (state, action) => {
        state.auditLogs.unshift(action.payload);
      });
  },
});

export default inventorySlice.reducer;
