import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
} from '../store/slices/customersSlice';
import { fetchSalesOrders } from '../store/slices/salesOrdersSlice';
import { attachCustomerOrderMetrics } from '../utils/analytics';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

function GInput({ label, value, onChange, error, type = 'text', min, step, placeholder, autoFocus }) {
  const [foc, setFoc] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide">{label}</label>}
      <input
        autoFocus={autoFocus}
        type={type}
        min={min}
        step={step}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value)}
        onFocus={() => setFoc(true)}
        onBlur={() => setFoc(false)}
        className={`w-full p-[10px_14px] rounded-lg text-gray-900 dark:text-white text-[13px] outline-none transition-all duration-200 bg-white/40 dark:bg-black/40 border ${error ? 'border-red-500 ring-1 ring-red-500/30' : foc ? 'border-executive-blue ring-1 ring-executive-blue/20' : 'border-black/10 dark:border-white/10'}`}
      />
      {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}
    </div>
  );
}

function GSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide">{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-[10px_14px] bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[13px] outline-none cursor-pointer focus:border-executive-blue focus:ring-1 focus:ring-executive-blue/20 transition-all">
        {options.map((option) => (
          <option key={option} value={option} className="bg-white dark:bg-charcoal text-gray-900 dark:text-white">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function CustModal({ data, onChange, onSave, onCancel, errors, isNew, isSaving }) {
  const set = (field) => (value) => onChange(field, value);

  return (
    <Modal onClose={onCancel}>
      <div className="w-[560px] max-h-[90vh] glass-panel rounded-lg shadow-2xl flex flex-col">
        <div className="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">{isNew ? 'Add Customer' : 'Edit Customer'}</h2>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-1">{isNew ? 'Create a persistent customer profile in the backend' : `Editing ${data.name}`}</p>
          </div>
          <button onClick={onCancel} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white bg-black/5 dark:bg-white/5 rounded-lg transition-colors border border-black/10 dark:border-white/10">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <GInput label="Customer Code" value={data.customerCode} onChange={set('customerCode')} error={errors.customerCode} autoFocus placeholder="CUST-102341" />
            <GInput label="Name" value={data.name} onChange={set('name')} error={errors.name} autoFocus={!isNew} placeholder="Company Name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <GInput label="Email" type="email" value={data.email} onChange={set('email')} error={errors.email} />
            <GInput label="Phone" value={data.phone} onChange={set('phone')} error={errors.phone} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <GInput label="City" value={data.city} onChange={set('city')} error={errors.city} />
            <GInput label="Country" value={data.country} onChange={set('country')} error={errors.country} />
          </div>
          <GSelect label="Status" value={data.status} onChange={set('status')} options={['Active', 'Inactive']} />
          {errors.form && <div className="text-[12px] text-red-500 font-medium">{errors.form}</div>}
        </div>

        <div className="p-5 border-t border-black/10 dark:border-white/10 flex justify-end gap-3 bg-black/20 rounded-b-lg">
          <button onClick={onCancel} className="px-4 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:bg-white/5 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={onSave} disabled={isSaving} className="px-5 py-2 text-[13px] font-bold bg-executive-blue hover:brightness-110 text-gray-900 dark:text-white rounded-lg transition-all shadow-lg shadow-executive-blue/20 disabled:opacity-70">
            {isSaving ? 'Saving...' : isNew ? 'Add Customer' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function createEmptyCustomer() {
  return {
    customerCode: '',
    name: '',
    email: '',
    phone: '',
    city: '',
    country: 'India',
    status: 'Active',
  };
}

export default function Customers() {
  const dispatch = useDispatch();
  const { customers, status, error } = useSelector((state) => state.customers);
  const { salesOrders, status: salesOrderStatus } = useSelector((state) => state.salesOrders);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState({ open: false, isNew: false, data: createEmptyCustomer(), errors: {} });

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCustomers());
    }

    if (salesOrderStatus === 'idle') {
      dispatch(fetchSalesOrders());
    }
  }, [dispatch, status, salesOrderStatus]);

  const customerRows = useMemo(
    () => attachCustomerOrderMetrics(customers, salesOrders),
    [customers, salesOrders]
  );

  const filtered = useMemo(() => {
    return customerRows.filter((customer) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        (customer.customerCode || '').toLowerCase().includes(searchTerm) ||
        (customer.name || '').toLowerCase().includes(searchTerm);

      if (!matchesSearch) {
        return false;
      }

      if (filter === 'Active') {
        return customer.status === 'Active';
      }

      if (filter === 'Inactive') {
        return customer.status === 'Inactive';
      }

      return true;
    });
  }, [customerRows, search, filter]);

  const stats = useMemo(() => {
    let active = 0;
    let spent = 0;

    customerRows.forEach((customer) => {
      if (customer.status === 'Active') {
        active += 1;
      }
      spent += Number(customer.totalSpent) || 0;
    });

    return {
      total: customerRows.length,
      active,
      inactive: customerRows.length - active,
      spent,
    };
  }, [customerRows]);

  const handleExportCSV = () => {
    const headers = ['Code', 'Name', 'Email', 'Phone', 'City', 'Country', 'Status', 'Orders', 'Value'];
    const rows = filtered.map((customer) =>
      [
        customer.customerCode,
        `"${customer.name}"`,
        `"${customer.email}"`,
        `"${customer.phone}"`,
        `"${customer.city}"`,
        `"${customer.country}"`,
        customer.status,
        customer.totalOrders,
        customer.totalSpent,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const openAdd = () => setModal({ open: true, isNew: true, errors: {}, data: createEmptyCustomer() });

  const validate = (data) => {
    const errors = {};

    if (!data.name?.trim()) {
      errors.name = 'Required';
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Enter a valid email';
    }

    return errors;
  };

  const handleSave = async () => {
    const errors = validate(modal.data);
    if (Object.keys(errors).length > 0) {
      setModal((current) => ({ ...current, errors }));
      return;
    }

    setIsSaving(true);
    try {
      if (modal.isNew) {
        await dispatch(createCustomer(modal.data)).unwrap();
      } else {
        await dispatch(
          updateCustomer({
            id: modal.data._id || modal.data.id,
            data: modal.data,
          })
        ).unwrap();
      }

      setModal({ open: false, isNew: false, data: createEmptyCustomer(), errors: {} });
    } catch (saveError) {
      setModal((current) => ({
        ...current,
        errors: { ...current.errors, form: saveError || 'Unable to save customer.' },
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) {
      return;
    }

    try {
      await dispatch(deleteCustomer(id)).unwrap();
    } catch (deleteError) {
      setModal((current) => ({
        ...current,
        errors: { ...current.errors, form: deleteError || 'Unable to delete customer.' },
      }));
    }
  };

  return (
    <>
      <div className="flex justify-between items-end mb-8 font-[Manrope]">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white leading-tight mb-1">Customer Directory</h1>
          <p className="text-gray-600 dark:text-gray-400 text-[14px]">Manage backend-backed customer profiles with live order totals.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white text-[14px] font-medium hover:bg-black/10 dark:bg-white/10 transition-all rounded active:scale-[0.98]">
            <span className="material-symbols-outlined text-lg">file_download</span>
            Export CSV
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-6 py-2.5 bg-executive-blue text-gray-900 dark:text-white text-[14px] font-medium hover:brightness-110 transition-all rounded shadow-lg shadow-executive-blue/30 active:scale-[0.98]">
            <span className="material-symbols-outlined text-lg">add</span>
            Add Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-[Manrope]">
        <div className="glass-panel p-6 rounded-lg card-light-source">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Total Clients</span>
            <span className="material-symbols-outlined text-gray-500 text-lg">group</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[48px] font-bold text-gray-900 dark:text-white leading-[1.1] tracking-[-0.02em]">{stats.total}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Persisted in MongoDB</p>
        </div>
        <div className="glass-panel p-6 rounded-lg card-light-source border-l-emerald-500/40">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Active</span>
            <span className="material-symbols-outlined text-emerald-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person_check</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[48px] font-bold text-gray-900 dark:text-white leading-[1.1] tracking-[-0.02em]">{stats.active}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Currently active accounts</p>
        </div>
        <div className="glass-panel p-6 rounded-lg card-light-source">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Inactive</span>
            <span className="material-symbols-outlined text-gray-500 text-lg">person_off</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[48px] font-bold text-gray-900 dark:text-white leading-[1.1] tracking-[-0.02em]">{stats.inactive}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Dormant accounts</p>
        </div>
        <div className="glass-panel p-6 rounded-lg card-light-source">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Lifetime Value</span>
            <span className="material-symbols-outlined text-gray-500 text-lg">loyalty</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[48px] font-bold text-gray-900 dark:text-white leading-[1.1] tracking-[-0.02em]">{formatCurrency(stats.spent)}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Live sales-order revenue</p>
        </div>
      </div>

      <div className="glass-panel rounded-lg flex flex-col font-[Manrope] mb-8">
        <div className="px-6 py-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex gap-4">
            <button onClick={() => setFilter('All')} className={`text-sm ${filter === 'All' ? 'font-bold text-gray-900 dark:text-white border-b-2 border-executive-blue' : 'font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300'} pb-5 -mb-[21px] transition-all`}>All Customers</button>
            <button onClick={() => setFilter('Active')} className={`text-sm ${filter === 'Active' ? 'font-bold text-gray-900 dark:text-white border-b-2 border-executive-blue' : 'font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300'} pb-5 -mb-[21px] transition-all`}>Active</button>
            <button onClick={() => setFilter('Inactive')} className={`text-sm ${filter === 'Inactive' ? 'font-bold text-gray-900 dark:text-white border-b-2 border-executive-blue' : 'font-medium text-gray-500 hover:text-gray-700 dark:text-gray-300'} pb-5 -mb-[21px] transition-all`}>Inactive</button>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded text-sm text-gray-900 dark:text-white focus:border-executive-blue outline-none transition-colors w-64"
              />
            </div>
          </div>
        </div>

        {(status === 'loading' || salesOrderStatus === 'loading') && (
          <div className="px-6 py-4 text-sm text-theme-textSub">Loading live customer data...</div>
        )}
        {error && <div className="px-6 py-4 text-sm text-red-500">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Code</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Name</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Contact</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Location</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Orders</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Value</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Status</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((customer) => {
                const isActive = customer.status === 'Active';

                return (
                  <tr key={customer._id || customer.id} className="hover:bg-black/5 dark:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-gray-500 font-bold">{customer.customerCode || 'AUTO'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-executive-blue/20 flex items-center justify-center text-executive-blue shrink-0">
                          {(customer.name || '?').charAt(0)}
                        </div>
                        {customer.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] text-gray-700 dark:text-gray-300">{customer.email || 'No email'}</div>
                      <div className="text-[11px] text-gray-500">{customer.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{customer.city || 'Unknown'}, {customer.country || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{customer.totalOrders}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-bold">{formatCurrency(customer.totalSpent)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">{customer.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal({ open: true, isNew: false, data: { ...customer }, errors: {} })} className="p-1 text-gray-500 hover:text-gray-900 dark:text-white transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                        <button onClick={() => handleDelete(customer._id || customer.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 text-sm">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">Showing {filtered.length} of {stats.total} customers</p>
        </div>
      </div>

      {modal.open && (
        <CustModal
          {...modal}
          isSaving={isSaving}
          onChange={(field, value) => setModal((current) => ({ ...current, data: { ...current.data, [field]: value } }))}
          onSave={handleSave}
          onCancel={() => setModal({ open: false, isNew: false, data: createEmptyCustomer(), errors: {} })}
        />
      )}
    </>
  );
}
