import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSalesOrders, createSalesOrder, editSalesOrder, removeSalesOrder } from '../store/slices/salesOrdersSlice';
import { fetchProducts, fetchAuditLogs } from '../store/slices/inventorySlice';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Utils ────────────────────────────────────────────────────────────────────
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const TILE_SIZES    = ['2×2 ft', '2×4 ft', '16×16 in', '20×20 in', '12×18 in', '1×1 ft'];
const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered'];
const FILTER_OPTIONS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];

const STATUS_DOT_COLOR = {
  Pending:    'bg-amber-500',
  Processing: 'bg-blue-500',
  Shipped:    'bg-indigo-500',
  Delivered:  'bg-emerald-500',
};

const STATUS_TEXT_COLOR = {
  Pending:    'text-amber-400',
  Processing: 'text-blue-400',
  Shipped:    'text-indigo-400',
  Delivered:  'text-emerald-400',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0,  scale: 1    }}
            exit={   { opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border text-[13px] font-semibold text-gray-900 dark:text-white
              ${t.type === 'success' ? 'bg-emerald-600/90 border-emerald-500/40'
              : t.type === 'error'   ? 'bg-red-600/90 border-red-500/40'
              :                        'bg-zinc-800/90 border-black/10 dark:border-white/10'}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
            </span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, push };
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 700, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * ease));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display.toLocaleString('en-IN')}</>;
}

// ─── Form Primitives ──────────────────────────────────────────────────────────
function GInput({ label, value, onChange, error, type = 'text', min, step, placeholder, autoFocus }) {
  const [foc, setFoc] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide">{label}</label>}
      <input
        autoFocus={autoFocus} type={type} min={min} step={step}
        value={value ?? ''} placeholder={placeholder}
        onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value)}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        className={`w-full p-[10px_14px] rounded-lg text-gray-900 dark:text-white text-[13px] outline-none transition-all duration-200 bg-white/40 dark:bg-black/40 border
          ${error ? 'border-red-500 ring-1 ring-red-500/30'
          : foc   ? 'border-executive-blue ring-1 ring-executive-blue/20'
          :         'border-black/10 dark:border-white/10'}`}
      />
      {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}
    </div>
  );
}

function GSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide">{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full p-[10px_14px] bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[13px] outline-none cursor-pointer focus:border-executive-blue focus:ring-1 focus:ring-executive-blue/20 transition-all">
        {options.map((o) => <option key={o} value={o} className="bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white">{o}</option>)}
      </select>
    </div>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={   { opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function SOModal({ data, onChange, onSave, onCancel, errors, isNew, nextId, inventoryProducts }) {
  const set = (f) => (v) => onChange(f, v);

  // When the user picks a tile, auto-fill the size (category) and price
  const handleTileChange = (selectedName) => {
    onChange('tileName', selectedName);
    const found = inventoryProducts.find((p) => p.name === selectedName);
    if (found) {
      onChange('productId', found.id || found._id);
      onChange('category', found.category);
      const price = found.sellingPrice ?? found.price ?? 0;
      onChange('pricePerBox', price);
      // Auto-calculate total with current qty
      onChange('total', (data.qty || 0) * price);
    } else {
      onChange('productId', '');
    }
  };

  const tileNames = inventoryProducts.map((p) => p.name);
  const computedTotal = (data.qty || 0) * (data.pricePerBox || 0);

  return (
    <Modal onClose={onCancel}>
      <div className="w-[560px] max-h-[90vh] glass-panel rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">
              {isNew ? 'Create Sales Order' : 'Edit Order'}
            </h2>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-1">
              {isNew ? `New order will be assigned ID #${nextId}` : `Editing Order #${data.id}`}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onCancel}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white bg-black/5 dark:bg-white/5 rounded-lg transition-colors border border-black/10 dark:border-white/10">
            <span className="material-symbols-outlined text-sm">close</span>
          </motion.button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Customer */}
          <GInput
            label="Customer Name" value={data.customerName} onChange={set('customerName')}
            error={errors.customerName} autoFocus placeholder="Customer name"
          />

          {/* Contact + Date */}
          <div className="grid grid-cols-2 gap-4">
            <GInput
              label="Contact Number (India)" value={data.contact} onChange={set('contact')}
              error={errors.contact} placeholder="Mobile number" type="tel"
            />
            <GInput
              label="Order Date" type="date" value={data.date} onChange={set('date')}
              error={errors.date}
            />
          </div>

          {/* Tile Name (from inventory) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">Tile Name</label>
            <select
              value={data.tileName || ''}
              onChange={(e) => handleTileChange(e.target.value)}
              className="w-full p-[10px_14px] bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[13px] outline-none cursor-pointer focus:border-executive-blue focus:ring-1 focus:ring-executive-blue/20 transition-all"
            >
              <option value="" className="bg-gray-100 dark:bg-zinc-900 text-gray-500">— Select Tile —</option>
              {tileNames.map((name) => (
                <option key={name} value={name} className="bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white">{name}</option>
              ))}
            </select>
            {errors.tileName && <span className="text-[11px] text-red-500 font-medium">{errors.tileName}</span>}
          </div>

          {/* Size (auto-filled, but editable) + Status */}
          <div className="grid grid-cols-2 gap-4">
            <GSelect label="Size (Category)" value={data.category} onChange={set('category')} options={TILE_SIZES} />
            <GSelect label="Status" value={data.status} onChange={set('status')} options={STATUS_OPTIONS} />
          </div>

          {/* Qty + Price Per Box + Auto-calculated Total */}
          <div className="grid grid-cols-3 gap-4">
            <GInput
              label="Quantity (Boxes)" type="number" min="1" value={data.qty}
              onChange={set('qty')} error={errors.qty} placeholder="e.g. 50"
            />
            <GInput
              label="Price / Box (₹)" type="number" min="0" step="1" value={data.pricePerBox}
              onChange={set('pricePerBox')} error={errors.pricePerBox} placeholder="Price"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide">Total Amount (₹)</label>
              <div className="w-full p-[10px_14px] rounded-lg text-[13px] font-bold border border-black/10 dark:border-white/10 bg-executive-blue/10 text-executive-blue">
                {formatCurrency(computedTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/10 dark:border-white/10 flex justify-end gap-3 bg-black/20 rounded-b-lg">
          <motion.button whileTap={{ scale: 0.96 }} onClick={onCancel}
            className="px-4 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:bg-white/5 rounded-lg transition-colors">
            Cancel
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onSave}
            className="px-5 py-2 text-[13px] font-bold bg-executive-blue hover:brightness-110 text-gray-900 dark:text-white rounded-lg transition-all shadow-lg shadow-executive-blue/20">
            {isNew ? 'Create Order' : 'Save Changes'}
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ orderId, customerName, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel}>
      <div className="w-[400px] glass-panel rounded-lg shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-400 text-[20px]">delete_forever</span>
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Delete Order</h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1">
              Are you sure you want to delete Order{' '}
              <span className="text-gray-900 dark:text-white font-semibold">#{orderId}</span> for{' '}
              <span className="text-gray-900 dark:text-white font-semibold">"{customerName}"</span>? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={onCancel}
            className="px-4 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:bg-white/5 rounded-lg transition-colors">
            Cancel
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onConfirm}
            className="px-5 py-2 text-[13px] font-bold bg-red-600 hover:bg-red-500 text-gray-900 dark:text-white rounded-lg transition-all">
            Delete
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ card, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.09, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="glass-panel p-6 rounded-lg card-light-source cursor-default"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">{card.label}</span>
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.09 + 0.2, type: 'spring', stiffness: 300 }}
          className={`material-symbols-outlined text-lg ${card.iconColor || 'text-gray-500'}`}
          style={card.fill ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {card.icon}
        </motion.span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-[42px] font-bold leading-[1.1] tracking-[-0.02em] ${card.color || 'text-gray-900 dark:text-white'}`}>
          {card.currency !== undefined
            ? formatCurrency(card.currency)
            : <AnimatedNumber value={card.value} />}
        </h3>
        {card.badge && <span className="text-amber-500 text-xs font-bold">{card.badge}</span>}
      </div>
      <p className="text-[11px] text-gray-500 mt-2">{card.sub}</p>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SalesOrders() {
  const dispatch = useDispatch();
  const { salesOrders = [], status } = useSelector((state) => state.salesOrders);
  const { products: inventoryProducts = [], status: inventoryStatus } = useSelector((state) => state.inventory);
  const { toasts, push: pushToast } = useToast();

  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [modal, setModal]           = useState({ open: false, isNew: false, data: null, errors: {} });
  const [deleteTarget, setDelete]   = useState(null);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchSalesOrders());
  }, [dispatch, status]);

  useEffect(() => {
    if (inventoryStatus === 'idle') dispatch(fetchProducts());
  }, [dispatch, inventoryStatus]);

  // ── Next auto ID ──────────────────────────────────────────────────────────
  const nextId = useMemo(() => {
    if (!salesOrders.length) return 1;
    return Math.max(...salesOrders.map((o) => Number(o.id) || 0)) + 1;
  }, [salesOrders]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return salesOrders.filter((so) => {
      const matchSearch =
        !q ||
        String(so.id).includes(q) ||
        (so.customerName || '').toLowerCase().includes(q) ||
        (so.contact || '').includes(q) ||
        (so.category || '').toLowerCase().includes(q) ||
        (so.tileName || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (filterStatus !== 'All') return so.status === filterStatus;
      return true;
    });
  }, [salesOrders, search, filterStatus]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let pending = 0, completed = 0, value = 0;
    salesOrders.forEach((so) => {
      if (so.status === 'Pending')   pending++;
      if (so.status === 'Delivered') completed++;
      value += so.total || 0;
    });
    return { total: salesOrders.length, pending, completed, value };
  }, [salesOrders]);

  const cardDefs = [
    { label: 'Total Orders',  icon: 'receipt_long',    value: stats.total,     sub: 'All recorded sales orders',  iconColor: '',                color: ''               },
    { label: 'Pending',       icon: 'pending_actions', value: stats.pending,   sub: 'Awaiting fulfillment',       iconColor: 'text-amber-500',  color: '', fill: true   },
    { label: 'Completed',     icon: 'check_circle',    value: stats.completed, sub: 'Successfully delivered',     iconColor: 'text-emerald-500', color: '', fill: true  },
    { label: 'Total Revenue', icon: 'payments',        value: null,            sub: 'Total SO revenue (₹)',       iconColor: '',                currency: stats.value   },
  ];

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['#', 'Customer', 'Contact', 'Tile Name', 'Size (Category)', 'Date', 'Qty (Boxes)', 'Status', 'Total (INR)'];
    const rows = filtered.map((so) =>
      `${so.id},"${so.customerName}",${so.contact},"${so.tileName || '—'}",${so.category},${so.date},${so.qty},${so.status},${so.total}`
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: `sales_orders_${new Date().toISOString().split('T')[0]}.csv`,
    }).click();
    URL.revokeObjectURL(url);
    pushToast('CSV exported successfully');
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (d) => {
    const e = {};
    const selectedProduct = inventoryProducts.find(
      (product) =>
        String(product.id || product._id) === String(d.productId || '') ||
        (product.name === d.tileName && product.category === d.category)
    );
    if (!d.customerName?.trim())                        e.customerName = 'Required';
    if (!d.contact || !/^[6-9]\d{9}$/.test(d.contact)) e.contact      = 'Enter valid 10-digit Indian number';
    if (!d.tileName?.trim())                            e.tileName     = 'Please select a tile';
    if (!selectedProduct)                               e.tileName     = 'Selected tile is no longer available';
    if (!d.date)                                        e.date         = 'Required';
    if (d.qty === '' || d.qty < 1)                      e.qty          = 'Must be ≥ 1';
    if (selectedProduct && d.qty > selectedProduct.stock && !d._id)    e.qty = `Only ${selectedProduct.stock} boxes in stock`;
    if (d.total === '' || d.total < 0)                  e.total        = 'Must be ≥ 0';
    return e;
  };

  // ── Open Add Modal ────────────────────────────────────────────────────────
  const openAdd = () => setModal({
    open: true, isNew: true, errors: {},
    data: {
      productId: '',
      customerName: '',
      contact: '',
      tileName: '',
      category: '2×2 ft',
      status: 'Pending',
      qty: 1,
      pricePerBox: 0,
      total: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  // -- Save via backend
  const handleSave = async () => {
    const errs = validate(modal.data);
    if (Object.keys(errs).length) return setModal((m) => ({ ...m, errors: errs }));

    try {
      if (modal.isNew) {
        await dispatch(createSalesOrder(modal.data)).unwrap();
        pushToast(`Order created for "${modal.data.customerName}"`);
      } else {
        await dispatch(editSalesOrder({ id: modal.data._id, data: modal.data })).unwrap();
        pushToast('Order updated');
      }

      dispatch(fetchProducts());
      dispatch(fetchAuditLogs());
      setModal({ open: false, isNew: false, data: null, errors: {} });
    } catch (error) {
      pushToast(typeof error === 'string' ? error : 'Unable to save sales order.', 'error');
    }
  };

  // -- Delete via backend
  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(removeSalesOrder(deleteTarget._id)).unwrap();
      dispatch(fetchProducts());
      dispatch(fetchAuditLogs());
      pushToast('Order deleted', 'error');
      setDelete(null);
    } catch (error) {
      pushToast(typeof error === 'string' ? error : 'Unable to delete sales order.', 'error');
    }
  };

  return (
    <>
      <Toast toasts={toasts} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-end mb-8 font-[Manrope]">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white leading-tight mb-1">Sales Orders</h1>
          <p className="text-gray-600 dark:text-gray-400 text-[14px]">Track outbound shipments and customer fulfillment.</p>
        </div>
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white text-[14px] font-medium hover:bg-black/10 dark:bg-white/10 transition-all rounded">
            <span className="material-symbols-outlined text-lg">file_download</span>
            Export CSV
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={openAdd}
            className="flex items-center gap-2 px-6 py-2.5 bg-executive-blue text-gray-900 dark:text-white text-[14px] font-medium hover:brightness-110 transition-all rounded shadow-lg shadow-executive-blue/30">
            <span className="material-symbols-outlined text-lg">add</span>
            New Order
          </motion.button>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-[Manrope]">
        {cardDefs.map((card, i) => (
          <StatCard key={card.label} card={card} index={i} />
        ))}
      </div>

      {/* ── Table Panel ─────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg flex flex-col font-[Manrope] mb-8">

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-4">

          {/* Search */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px] pointer-events-none">search</span>
            <input
              type="text" placeholder="Search orders, customer, contact…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-[13px] text-gray-900 dark:text-white placeholder:text-gray-600 focus:border-executive-blue outline-none transition-all w-64 hover:border-black/20 dark:border-white/20"
            />
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </motion.button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterOpen((o) => !o)}
              className={[
                'flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all',
                filterStatus !== 'All'
                  ? 'bg-executive-blue/15 border-executive-blue/40 text-blue-300'
                  : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:border-black/20 dark:border-white/20',
              ].join(' ')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <line x1="2" y1="4"   x2="14" y2="4"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="5.5" cy="4"   r="1.8" style={{ fill: 'currentColor' }}/>
                <line x1="2" y1="8.5" x2="14" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10.5" cy="8.5" r="1.8" style={{ fill: 'currentColor' }}/>
                <line x1="2" y1="13"  x2="14" y2="13"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="6.5" cy="13"  r="1.8" style={{ fill: 'currentColor' }}/>
              </svg>
              <span>{filterStatus === 'All' ? 'Filter' : filterStatus}</span>
              {filterStatus !== 'All' && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLOR[filterStatus] || 'bg-blue-400'}`}
                />
              )}
              <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </motion.button>

            <AnimatePresence>
              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={   { opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute right-0 top-[calc(100%+8px)] z-20 w-44 bg-[#111114] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
                  >
                    {FILTER_OPTIONS.map((opt) => {
                      const active = filterStatus === opt;
                      return (
                        <motion.button
                          key={opt}
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                          onClick={() => { setFilter(opt); setFilterOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
                        >
                          {opt === 'All'
                            ? <span className="w-2 h-2 rounded-full border border-gray-500 shrink-0" />
                            : <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLOR[opt]}`} />
                          }
                          <span className={opt !== 'All' ? (STATUS_TEXT_COLOR[opt] || '') : ''}>{opt}</span>
                          {active && (
                            <span className="material-symbols-outlined text-[14px] text-blue-400 ml-auto">check</span>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5">#</th>
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5">Customer</th>
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5">Contact</th>
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5">Tile Name</th>
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5">Size</th>
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5">Date</th>
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5">Qty</th>
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5">Status</th>
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5">Total</th>
                <th className="px-5 py-4 border-b border-black/5 dark:border-white/5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filtered.map((so, idx) => (
                  <motion.tr
                    key={so.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.02, 0.2) }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
                    className="group transition-colors"
                  >
                    {/* ID */}
                    <td className="px-5 py-4 text-xs font-mono text-executive-blue font-bold">{so.id}</td>

                    {/* Customer */}
                    <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white">{so.customerName}</td>

                    {/* Contact */}
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {so.contact ? `+91 ${so.contact}` : '—'}
                    </td>

                    {/* Tile Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-gray-500">grid_view</span>
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{so.tileName || '—'}</span>
                      </div>
                    </td>

                    {/* Category / Size */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px] font-semibold text-gray-700 dark:text-gray-300 font-mono">
                        {so.category || '—'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{so.date}</td>

                    {/* Qty */}
                    <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white">{so.qty ?? '—'}</td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <motion.div
                          className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLOR[so.status] || 'bg-gray-500'}`}
                          animate={so.status === 'Pending' ? { scale: [1, 1.5, 1] } : {}}
                          transition={{ repeat: so.status === 'Pending' ? Infinity : 0, duration: 1.4 }}
                        />
                        <span className={`text-[11px] font-bold uppercase tracking-tighter ${STATUS_TEXT_COLOR[so.status] || 'text-gray-600 dark:text-gray-400'}`}>
                          {so.status}
                        </span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4 text-sm text-gray-900 dark:text-white font-bold">{formatCurrency(so.total)}</td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button whileTap={{ scale: 0.85 }}
                          onClick={() => setModal({ open: true, isNew: false, data: { ...so }, errors: {} })}
                          className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 rounded transition-colors">
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.85 }}
                          onClick={() => setDelete(so)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-gray-500 text-sm">
                    <span className="material-symbols-outlined text-3xl block mb-2 mx-auto opacity-30">search_off</span>
                    No sales orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            Showing {filtered.length} of {stats.total} order{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal.open && (
          <SOModal
            {...modal}
            nextId={nextId}
            inventoryProducts={inventoryProducts}
            onChange={(f, v) => setModal((m) => {
              const newData = { ...m.data, [f]: v };
              // Auto-calculate total when qty or pricePerBox changes
              if (f === 'qty' || f === 'pricePerBox') {
                newData.total = (f === 'qty' ? (v || 0) : (newData.qty || 0)) * (f === 'pricePerBox' ? (v || 0) : (newData.pricePerBox || 0));
              }
              return { ...m, data: newData };
            })}
            onSave={handleSave}
            onCancel={() => setModal({ open: false })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            orderId={deleteTarget.id}
            customerName={deleteTarget.customerName}
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setDelete(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
