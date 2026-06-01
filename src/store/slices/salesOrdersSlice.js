import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchSalesOrders = createAsyncThunk('salesOrders/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/sales-orders');
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to load sales orders.');
  }
});

export const createSalesOrder = createAsyncThunk('salesOrders/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/sales-orders', data);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create sales order.');
  }
});

export const editSalesOrder = createAsyncThunk('salesOrders/edit', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/sales-orders/${id}`, data);
    return res.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update sales order.');
  }
});

export const removeSalesOrder = createAsyncThunk('salesOrders/remove', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/sales-orders/${id}`);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete sales order.');
  }
});

const salesOrdersSlice = createSlice({
  name: 'salesOrders',
  initialState: { salesOrders: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesOrders.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => { state.status = 'succeeded'; state.salesOrders = action.payload; })
      .addCase(fetchSalesOrders.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload || action.error.message; })
      .addCase(createSalesOrder.fulfilled, (state, action) => { state.salesOrders.unshift(action.payload); })
      .addCase(createSalesOrder.rejected, (state, action) => { state.error = action.payload || action.error.message; })
      .addCase(editSalesOrder.fulfilled, (state, action) => {
        const idx = state.salesOrders.findIndex(o => o._id === action.payload._id);
        if (idx !== -1) state.salesOrders[idx] = action.payload;
      })
      .addCase(editSalesOrder.rejected, (state, action) => { state.error = action.payload || action.error.message; })
      .addCase(removeSalesOrder.fulfilled, (state, action) => {
        state.salesOrders = state.salesOrders.filter(o => String(o._id) !== String(action.payload));
      })
      .addCase(removeSalesOrder.rejected, (state, action) => { state.error = action.payload || action.error.message; });
  },
});

export default salesOrdersSlice.reducer;
