import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', async () => {
  const res = await api.get('/suppliers');
  return res.data;
});

export const createSupplier = createAsyncThunk('suppliers/create', async (data) => {
  const res = await api.post('/suppliers', data);
  return res.data;
});

export const editSupplier = createAsyncThunk('suppliers/edit', async ({ id, data }) => {
  const res = await api.put(`/suppliers/${id}`, data);
  return res.data;
});

export const removeSupplier = createAsyncThunk('suppliers/remove', async (id) => {
  await api.delete(`/suppliers/${id}`);
  return id;
});

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState: { suppliers: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchSuppliers.fulfilled, (state, action) => { state.status = 'succeeded'; state.suppliers = action.payload; })
      .addCase(fetchSuppliers.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message; })
      .addCase(createSupplier.fulfilled, (state, action) => { state.suppliers.unshift(action.payload); })
      .addCase(editSupplier.fulfilled, (state, action) => {
        const idx = state.suppliers.findIndex(s => s._id === action.payload._id);
        if (idx !== -1) state.suppliers[idx] = action.payload;
      })
      .addCase(removeSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter(s => String(s._id) !== String(action.payload));
      });
  },
});

export default suppliersSlice.reducer;
