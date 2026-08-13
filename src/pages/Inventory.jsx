import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts, addProductThunk, fetchAuditLogs, createAuditLog } from '../store/slices/inventorySlice';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';


// ─── Utils ────────────────────────────────────────────────────────────────────
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

function getStatus(stock, reorderPoint) {
  if (stock === 0)
    return { label: 'Out of Stock', dot: 'bg-red-500',     text: 'text-red-400'     };
  if (stock < reorderPoint)
    return { label: 'Low Stock',    dot: 'bg-amber-500',   text: 'text-amber-400'   };
  if (stock < 100)
    return { label: 'Limited Stock', dot: 'bg-orange-500',  text: 'text-orange-400'  };
  return   { label: 'Full Stock',   dot: 'bg-emerald-500', text: 'text-emerald-400' };
}

function makeAuditEntry(action, product, extra = {}) {
  return {
    id: Date.now() + Math.random(),
    action,
    productName: product.name,
    prevQty: extra.prevQty ?? null,
    newQty:  extra.newQty  ?? null,
    admin: 'Admin',
    timestamp: new Date().toISOString(),
  };
}

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

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, formatter }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    let start = null;
    const duration = 800; // ms
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = from + (value - from) * ease;
      setDisplay(currentVal);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <>{formatter ? formatter(display) : Math.round(display).toLocaleString()}</>;
}

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: (index) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1],
    },
  }),
  hover: {
    y: -4,
    scale: 1.015,
    boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.25)',
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

const iconVariants = {
  hover: {
    scale: 1.15,
    rotate: 8,
    transition: { type: 'spring', stiffness: 300, damping: 15 },
  },
};

// ─── Form primitives ──────────────────────────────────────────────────────────
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

// ─── Modal shell ──────────────────────────────────────────────────────────────
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

// ─── Add / Edit modal ─────────────────────────────────────────────────────────
function ItemModal({ data, onChange, onSave, onCancel, errors, isNew }) {
  const set = (f) => (v) => onChange(f, v);
  const TILE_SIZES = ['2×2 ft', '2×4 ft', '16×16 in', '20×20 in', '12×18 in', '1×1 ft'];

  return (
    <Modal onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="w-full max-w-lg mx-4 sm:mx-0 sm:w-[500px] max-h-[90vh] glass-panel rounded-lg shadow-2xl flex flex-col">
        <div className="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">
              {isNew ? 'Add New Tile' : 'Edit Tile'}
            </h2>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-1">
              {isNew ? 'Fill in tile product details below' : `Editing "${data.name}"`}
            </p>
          </div>
          <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onCancel}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white bg-black/5 dark:bg-white/5 rounded-lg transition-colors border border-black/10 dark:border-white/10">
            <span className="material-symbols-outlined text-sm">close</span>
          </motion.button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          <GInput
            label="Tile Name" value={data.name} onChange={set('name')}
            error={errors.name} autoFocus placeholder="e.g. Ivory Marble GVT"
          />
          <div className="grid grid-cols-2 gap-4">
            <GInput label="Brand" value={data.brand} onChange={set('brand')} placeholder="e.g. Kajaria" />
            <GSelect
              label="Size" value={data.category} onChange={set('category')}
              options={TILE_SIZES}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <GInput label="Stock (boxes)" type="number" min="0"      value={data.stock} onChange={set('stock')} error={errors.stock} />
            <GInput label="Cost (₹)"      type="number" min="0" step="1" value={data.cost}  onChange={set('cost')}  error={errors.cost}  />
            <GInput label="Price (₹)"     type="number" min="0" step="1" value={data.price} onChange={set('price')} error={errors.price} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <GInput label="Reorder Point" type="number" min="0" value={data.reorderPoint} onChange={set('reorderPoint')} />
          </div>
        </div>

        <div className="p-5 border-t border-black/10 dark:border-white/10 flex justify-end gap-3 bg-black/20 rounded-b-lg">
          <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onCancel}
            className="px-4 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:bg-white/5 rounded-lg transition-colors">
            Cancel
          </motion.button>
          <motion.button type="submit" whileTap={{ scale: 0.96 }}
            className="px-5 py-2 text-[13px] font-bold bg-executive-blue hover:brightness-110 text-gray-900 dark:text-white rounded-lg transition-all shadow-lg shadow-executive-blue/20">
            {isNew ? 'Add Tile' : 'Save Changes'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Audit log table (inline) ─────────────────────────────────────────────────
const ACTION_META = {
  Added:          { icon: 'add_circle', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  Deleted:        { icon: 'delete',     color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
  Updated:        { icon: 'edit',       color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  'Qty Changed':  { icon: 'swap_vert',  color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20'   },
  'Order Created': { icon: 'shopping_bag', color: 'text-amber-400', bg: 'bg-amber-500/10',  border: 'border-amber-500/20'   },
  'Order Updated': { icon: 'sync_alt',     color: 'text-blue-400',  bg: 'bg-blue-500/10',   border: 'border-blue-500/20'    },
  'Order Deleted': { icon: 'undo',         color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

function AuditTable({ logs }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 uppercase tracking-widest text-[10px] font-bold">
            <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">#</th>
            <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Action</th>
            <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Product</th>
            <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Qty Change</th>
            <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">User</th>
            <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Date</th>
            <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          <AnimatePresence>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-500 text-sm">
                  <span className="material-symbols-outlined text-3xl block mb-2 mx-auto opacity-30">history</span>
                  No audit records yet.
                </td>
              </tr>
            ) : logs.map((log, i) => {
              const meta = ACTION_META[log.action] || ACTION_META['Updated'];
              const ts = new Date(log.timestamp);
              const dateStr = ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
              const timeStr = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.tr
                  key={log.id || i}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.2) }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
                  className="group transition-colors"
                >
                  <td className="px-6 py-4 text-xs font-mono text-executive-blue font-bold">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${meta.color} ${meta.bg}`}>
                        <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
                      </div>
                      <span className={`text-[12px] font-bold uppercase tracking-wide ${meta.color}`}>{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{log.productName}</td>
                  <td className="px-6 py-4">
                    {log.prevQty !== null && log.prevQty !== undefined ? (
                      <span className="text-[12px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                        <span className="font-mono text-gray-500">{log.prevQty}</span>
                        <span className="material-symbols-outlined text-[13px] text-gray-600">arrow_forward</span>
                        <span className="font-mono text-gray-900 dark:text-white font-bold">{log.newQty}</span>
                        <span className="text-gray-500 text-[10px]">boxes</span>
                      </span>
                    ) : (
                      <span className="text-gray-600 text-[12px]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{log.admin}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono text-[12px]">{dateStr}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono text-[12px]">{timeStr}</td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ stock, reorderPoint }) {
  const s = getStatus(stock, reorderPoint);
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`w-1.5 h-1.5 rounded-full ${s.dot}`}
        animate={{ scale: stock === 0 ? [1, 1.5, 1] : 1 }}
        transition={{ repeat: stock === 0 ? Infinity : 0, duration: 1.4 }}
      />
      <span className={`text-[11px] font-bold uppercase tracking-tighter ${s.text}`}>{s.label}</span>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel}>
      <div className="w-full max-w-md mx-4 sm:mx-0 sm:w-[400px] glass-panel rounded-lg shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-400 text-[20px]">delete_forever</span>
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Delete Tile</h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1">
              Are you sure you want to delete <span className="text-gray-900 dark:text-white font-semibold">"{name}"</span>? This action cannot be undone.
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

// ─── Summary card ─────────────────────────────────────────────────────────────
function StatCard({ card, index }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      custom={index}
      className="glass-panel p-6 rounded-lg card-light-source cursor-default"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">{card.label}</span>
        <motion.span
          variants={iconVariants}
          className={`material-symbols-outlined text-lg ${card.iconColor || 'text-gray-500'}`}
          style={card.iconColor ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {card.icon}
        </motion.span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-[48px] font-bold leading-[1.1] tracking-[-0.02em] ${card.color || 'text-gray-900 dark:text-white'}`}>
          {card.currency !== undefined ? (
            <AnimatedNumber value={card.currency} formatter={formatCurrency} />
          ) : (
            <AnimatedNumber value={card.value} />
          )}
        </h3>
        {card.badge && <span className="text-amber-500 text-xs font-bold">{card.badge}</span>}
      </div>
      <p className="text-[11px] text-gray-500 mt-2">{card.sub}</p>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Inventory() {
  const dispatch = useDispatch();
  const { products, auditLogs, status, auditStatus } = useSelector((state) => state.inventory);
  const { toasts, push: pushToast } = useToast();

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [auditOpen, setAuditOpen]       = useState(false);
  const [modal, setModal]               = useState({ open: false, isNew: false, data: null, errors: {} });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const persistAuditLog = useCallback(async (auditLog) => {
    try {
      await dispatch(createAuditLog(auditLog)).unwrap();
      return true;
    } catch {
      pushToast('Tile saved, but audit log could not be written.', 'info');
      return false;
    }
  }, [dispatch, pushToast]);

  // Fetch products from backend on mount
  useEffect(() => {
    if (status === 'idle') dispatch(fetchProducts());
  }, [dispatch, status]);

  useEffect(() => {
    if (auditStatus === 'idle') dispatch(fetchAuditLogs());
  }, [auditStatus, dispatch]);

  const FILTER_OPTIONS = ['All', 'Full Stock', 'Limited Stock', 'Low Stock', 'Out of Stock'];
  const TILE_SIZES     = ['2×2 ft', '2×4 ft', '16×16 in', '20×20 in', '12×18 in', '1×1 ft'];

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (filterStatus !== 'All') return getStatus(p.stock, p.reorderPoint).label === filterStatus;
      return true;
    });
  }, [products, search, filterStatus]);

  // ── Live stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalUnits = 0, totalValue = 0, needsAttention = 0;
    for (const p of products) {
      totalUnits  += p.stock;
      totalValue  += p.stock * (p.sellingPrice ?? p.price ?? 0);
      const { label } = getStatus(p.stock, p.reorderPoint);
      if (['Low Stock', 'Out of Stock'].includes(label)) needsAttention++;
    }
    return { skus: products.length, totalUnits, totalValue, needsAttention };
  }, [products]);

  const cardDefs = [
    { label: 'Total Designs',   icon: 'grid_view',  value: stats.skus,           sub: 'Active tile SKUs in stock',          color: '',               iconColor: ''                },
    { label: 'Total Boxes',     icon: 'inventory_2', value: stats.totalUnits,    sub: 'Combined box count across all tiles', color: '',               iconColor: ''                },
    { label: 'Needs Restock',   icon: 'warning',    value: stats.needsAttention, sub: 'Below reorder threshold',            color: 'text-amber-500', iconColor: 'text-amber-500', badge: 'Low/Out' },
    { label: 'Inventory Value', icon: 'payments',   value: null,                 sub: 'Valuation at current selling price', color: '',               currency: stats.totalValue   },
  ];

  // ── CSV export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['#', 'Tile Name', 'Size', 'Stock (boxes)', 'Cost (₹)', 'Price (₹)', 'Reorder Pt.', 'Status'];
    const rows = filtered.map((p, i) => {
      const s = getStatus(p.stock, p.reorderPoint);
      return `${i + 1},"${p.name}",${p.category},${p.stock},${p.cost},${p.price},${p.reorderPoint},${s.label}`;
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: `tiles_inventory_${new Date().toISOString().split('T')[0]}.csv`,
    }).click();
    URL.revokeObjectURL(url);
    pushToast('CSV exported successfully');
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (d) => {
    const e = {};
    if (!d.name?.trim())                   e.name  = 'Required';
    if (d.stock === '' || d.stock < 0)     e.stock = 'Must be ≥ 0';
    if (d.price === '' || d.price <= 0)    e.price = 'Must be > 0';
    return e;
  };

  // ── Open add modal ────────────────────────────────────────────────────────
  const openAdd = () => setModal({
    open: true, isNew: true, errors: {},
    data: { name: '', brand: '', category: '2×2 ft', stock: '', cost: '', price: '', reorderPoint: '' },
  });

  // ── Save (add or update) via backend ─────────────────────────────────────
  const handleSave = async () => {
    const errs = validate(modal.data);
    if (Object.keys(errs).length) return setModal((m) => ({ ...m, errors: errs }));

    try {
      if (modal.isNew) {
        const payload = {
          name: modal.data.name,
          brand: modal.data.brand || 'Generic',
          category: modal.data.category,
          stock: Number(modal.data.stock) || 0,
          costPrice: Number(modal.data.cost) || 0,
          sellingPrice: Number(modal.data.price) || 0,
          reorderPoint: Number(modal.data.reorderPoint) || 0,
          sku: `TIL-${Date.now()}`,
        };
        await dispatch(addProductThunk(payload)).unwrap();
        const auditLog = makeAuditEntry('Added', { ...modal.data, stock: Number(modal.data.stock) || 0 }, { newQty: Number(modal.data.stock) || 0 });
        await persistAuditLog(auditLog);
        pushToast(`"${modal.data.name}" added to inventory`);
      } else {
        const original = products.find((p) => p.id === modal.data.id);
        const payload  = {
          name: modal.data.name,
          brand: modal.data.brand || 'Generic',
          category: modal.data.category,
          stock: Number(modal.data.stock) || 0,
          costPrice: Number(modal.data.cost) || 0,
          sellingPrice: Number(modal.data.price) || 0,
          reorderPoint: Number(modal.data.reorderPoint) || 0,
        };
        await api.put(`/products/${modal.data.id}`, payload);
        dispatch(fetchProducts()); // Refresh from backend
        const qtyChanged = original && original.stock !== Number(modal.data.stock);
        const auditLog = makeAuditEntry(qtyChanged ? 'Qty Changed' : 'Updated', { ...modal.data, stock: Number(modal.data.stock) || 0 }, { prevQty: original?.stock ?? null, newQty: Number(modal.data.stock) || 0 });
        await persistAuditLog(auditLog);
        pushToast(`"${modal.data.name}" updated`);
      }

      setModal({ open: false, isNew: false, data: null, errors: {} });
    } catch (error) {
      pushToast(error?.message || 'Unable to save tile right now.', 'error');
    }
  };

  // ── Delete via backend ────────────────────────────────────────────────────
  const confirmDelete = (id) => {
    const item = products.find((p) => p.id === id);
    if (item) setDeleteTarget(item);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      dispatch(fetchProducts()); // Refresh from backend
      const auditLog = makeAuditEntry('Deleted', deleteTarget, { prevQty: deleteTarget.stock, newQty: 0 });
      await persistAuditLog(auditLog);
      pushToast(`"${deleteTarget.name}" deleted`, 'error');
      setDeleteTarget(null);
    } catch (error) {
      pushToast(error?.message || 'Unable to delete tile right now.', 'error');
    }
  };

  return (
    <>
      <Toast toasts={toasts} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-end mb-8 font-[Manrope]">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white leading-tight mb-1">Tile Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400 text-[14px]">Real-time stock tracking for all tile designs and sizes.</p>
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
            Add Tile
          </motion.button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-[Manrope]">
        {cardDefs.map((card, i) => (
          <StatCard key={card.label} card={card} index={i} />
        ))}
      </div>

      {/* ── Table panel ─────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg flex flex-col font-[Manrope] mb-8">

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-4">

          {/* Left side: Search + Audit Logs toggle */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px] pointer-events-none">search</span>
              <input
                type="text" placeholder={auditOpen ? 'Search audit logs…' : 'Search tiles…'}
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-[13px] text-gray-900 dark:text-white placeholder:text-gray-600 focus:border-executive-blue outline-none transition-all w-52 hover:border-black/20 dark:border-white/20"
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

            {/* Audit Logs toggle button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setAuditOpen((o) => !o); setSearch(''); }}
              className={[
                'flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-all',
                auditOpen
                  ? 'bg-executive-blue/15 border-executive-blue/40 text-blue-300'
                  : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:border-black/20 dark:border-white/20',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[17px]">history</span>
              <span>Audit Logs</span>
              {auditLogs.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 bg-executive-blue/80 text-[10px] font-bold text-white rounded-full leading-none">
                  {auditLogs.length}
                </span>
              )}
            </motion.button>
          </div>

          {/* Right side: Filter (only visible in inventory view) */}
          {!auditOpen && (
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
                  <circle cx="5.5" cy="4"   r="1.8" fill="var(--tw-bg-opacity, currentColor)" style={{fill:'currentColor'}}/>
                  <line x1="2" y1="8.5" x2="14" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10.5" cy="8.5" r="1.8" style={{fill:'currentColor'}}/>
                  <line x1="2" y1="13"  x2="14" y2="13"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="6.5" cy="13"  r="1.8" style={{fill:'currentColor'}}/>
                </svg>
                <span>{filterStatus === 'All' ? 'Filter' : filterStatus}</span>
                {filterStatus !== 'All' && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400" />
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
                      className="absolute right-0 top-[calc(100%+8px)] z-20 w-48 bg-[#111114] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                      {FILTER_OPTIONS.map((opt) => {
                        const active = filterStatus === opt;
                        const dotColor = { 'Full Stock': 'bg-emerald-500', 'Limited Stock': 'bg-orange-500', 'Low Stock': 'bg-amber-500', 'Out of Stock': 'bg-red-500' };
                        const txtColor = { 'Full Stock': 'text-emerald-400', 'Limited Stock': 'text-orange-400', 'Low Stock': 'text-amber-400', 'Out of Stock': 'text-red-400' };
                        return (
                          <motion.button
                            key={opt}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                            onClick={() => { setFilterStatus(opt); setFilterOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${active ? 'text-gray-900 dark:text-white bg-black/10 dark:bg-white/8' : 'text-gray-600 dark:text-gray-400'}`}
                          >
                            {opt === 'All'
                              ? <span className="w-2 h-2 rounded-full border border-gray-500 shrink-0" />
                              : <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor[opt]}`} />
                            }
                            <span className={opt !== 'All' ? txtColor[opt] : ''}>{opt}</span>
                            {active && <span className="material-symbols-outlined text-[14px] text-blue-400 ml-auto">check</span>}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Conditional: Audit Log table or Inventory table */}
        {auditOpen ? (
          <>
            <AuditTable logs={auditLogs.filter((log) => {
              if (!search) return true;
              const q = search.toLowerCase();
              return (log.productName || '').toLowerCase().includes(q)
                || (log.action || '').toLowerCase().includes(q)
                || (log.admin || '').toLowerCase().includes(q);
            })} />
            <div className="px-6 py-4 border-t border-black/5 dark:border-white/5">
              <p className="text-xs text-gray-500 font-medium">
                Showing {auditLogs.filter((log) => {
                  if (!search) return true;
                  const q = search.toLowerCase();
                  return (log.productName || '').toLowerCase().includes(q)
                    || (log.action || '').toLowerCase().includes(q)
                    || (log.admin || '').toLowerCase().includes(q);
                }).length} of {auditLogs.length} audit record{auditLogs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                    <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">#</th>
                    <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Tile Name</th>
                    <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Brand</th>
                    <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Size</th>
                    <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Stock (Boxes)</th>
                    <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Cost</th>
                    <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Price</th>
                    <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Status</th>
                    <th className="px-6 py-4 border-b border-black/5 dark:border-white/5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {filtered.map((item, idx) => {
                      const isLow = item.stock < item.reorderPoint;
                      return (
                        <motion.tr
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
                          transition={{ duration: 0.22, delay: Math.min(idx * 0.02, 0.2) }}
                          whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
                          className="group transition-colors"
                        >
                          <td className="px-6 py-4 text-xs font-mono text-executive-blue font-bold">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:text-white transition-colors text-[18px]">grid_view</span>
                              </div>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {item.brand || 'Generic'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-bold px-2 py-1 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 font-mono">
                              {item.category}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm font-semibold ${isLow ? 'text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                            {item.stock}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.costPrice ?? item.cost)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-bold">{formatCurrency(item.sellingPrice ?? item.price)}</td>
                          <td className="px-6 py-4">
                            <StatusBadge stock={item.stock} reorderPoint={item.reorderPoint} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button whileTap={{ scale: 0.85 }}
                                onClick={() => setModal({ open: true, isNew: false, data: { ...item }, errors: {} })}
                                className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 rounded transition-colors">
                                <span className="material-symbols-outlined text-[17px]">edit</span>
                              </motion.button>
                              <motion.button whileTap={{ scale: 0.85 }}
                                onClick={() => confirmDelete(item.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                                <span className="material-symbols-outlined text-[17px]">delete</span>
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>

                  {status === 'loading' && (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center text-gray-500 text-sm">
                        <span className="material-symbols-outlined text-3xl block mb-2 mx-auto opacity-30 animate-spin">progress_activity</span>
                        Loading inventory from database...
                      </td>
                    </tr>
                  )}
                  {status !== 'loading' && filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center text-gray-500 text-sm">
                        <span className="material-symbols-outlined text-3xl block mb-2 mx-auto opacity-30">search_off</span>
                        No tiles match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-black/5 dark:border-white/5">
              <p className="text-xs text-gray-500 font-medium">
                Showing {filtered.length} of {stats.skus} tile{stats.skus !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal.open && (
          <ItemModal
            {...modal}
            onChange={(f, v) => setModal((m) => ({ ...m, data: { ...m.data, [f]: v } }))}
            onSave={handleSave}
            onCancel={() => setModal({ open: false })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            name={deleteTarget.name}
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>


    </>
  );
}
