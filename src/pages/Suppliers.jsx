import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSuppliers, createSupplier, editSupplier, removeSupplier } from '../store/slices/suppliersSlice';
import { motion, AnimatePresence } from 'framer-motion';


// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
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

// ─── Animated Number ──────────────────────────────────────────────────────────
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

// ─── Form Primitives ──────────────────────────────────────────────────────────
function GInput({ label, value, onChange, error, type = 'text', min, step, placeholder, autoFocus }) {
  const [foc, setFoc] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">{label}</label>}
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
      {label && <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">{label}</label>}
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
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Add / Edit Supplier Modal ────────────────────────────────────────────────
function SuppModal({ data, onChange, onSave, onCancel, errors, isNew }) {
  const set = (f) => (v) => onChange(f, v);

  const TILE_TYPES = [
    'Vitrified Tiles', 'Ceramic Wall Tiles', 'Floor Tiles', 'GVT (Glazed Vitrified)',
    'PGVT (Polished GVT)', 'Porcelain Tiles', 'Large Format Slabs', 'Digital Tiles',
    'Outdoor / Anti-Skid', 'Mosaic & Décor', 'Marble Look', 'Multiple Types',
  ];
  const PAYMENT_OPTIONS = ['Advance', '7 Days Credit', '15 Days Credit', '30 Days Credit', '45 Days Credit', '60 Days Credit', 'PDC / Cheque'];

  return (
    <Modal onClose={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="w-[560px] max-h-[90vh] glass-panel rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight">
              {isNew ? 'Add New Supplier' : 'Edit Supplier'}
            </h2>
            <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-1">
              {isNew ? 'Enter tiles supplier details below' : `Editing "${data.name}"`}
            </p>
          </div>
          <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onCancel}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white bg-black/5 dark:bg-white/5 rounded-lg transition-colors border border-black/10 dark:border-white/10">
            <span className="material-symbols-outlined text-sm">close</span>
          </motion.button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Company & Contact Person */}
          <div className="grid grid-cols-2 gap-4">
            <GInput label="Company Name" value={data.name} onChange={set('name')} error={errors.name} autoFocus placeholder="e.g. Kajaria Ceramics" />
            <GInput label="Contact Person" value={data.contactPerson} onChange={set('contactPerson')} error={errors.contactPerson} placeholder="e.g. Rajesh Sharma" />
          </div>

          {/* Tile Type & GST */}
          <div className="grid grid-cols-2 gap-4">
            <GSelect label="Tile Type / Specialty" value={data.tileType} onChange={set('tileType')} options={TILE_TYPES} />
            <GInput label="GST Number" value={data.gst} onChange={set('gst')} error={errors.gst} placeholder="e.g. 24AABCX1234Y1ZK" />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-4">
            <GInput label="Phone" value={data.phone} onChange={set('phone')} error={errors.phone} placeholder="+91 98XXX-XXXXX" />
            <GInput label="Email" type="email" value={data.email} onChange={set('email')} error={errors.email} placeholder="orders@company.com" />
          </div>

          {/* Ordered Qty & Payment Terms */}
          <div className="grid grid-cols-2 gap-4">
            <GInput label="Ordered Quantity" type="number" min="0" value={data.orderedQty} onChange={set('orderedQty')} placeholder="e.g. 500" />
            <GSelect label="Payment Terms" value={data.paymentTerms} onChange={set('paymentTerms')} options={PAYMENT_OPTIONS} />
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <GSelect label="Status" value={data.status} onChange={set('status')} options={['Active', 'Review', 'Inactive']} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/10 dark:border-white/10 flex justify-end gap-3 bg-black/20 rounded-b-lg">
          <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={onCancel}
            className="px-4 py-2 text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white hover:bg-black/5 dark:bg-white/5 rounded-lg transition-colors">
            Cancel
          </motion.button>
          <motion.button type="submit" whileTap={{ scale: 0.96 }}
            className="px-5 py-2 text-[13px] font-bold bg-executive-blue hover:brightness-110 text-gray-900 dark:text-white rounded-lg transition-all shadow-lg shadow-executive-blue/20">
            {isNew ? 'Add Supplier' : 'Save Changes'}
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel}>
      <div className="w-[400px] glass-panel rounded-lg shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-400 text-[20px]">delete_forever</span>
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Remove Supplier</h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1">
              Are you sure you want to remove <span className="text-gray-900 dark:text-white font-semibold">"{name}"</span>? This action cannot be undone.
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
            Remove
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
          style={card.fill ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {card.icon}
        </motion.span>
      </div>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-[48px] font-bold leading-[1.1] tracking-[-0.02em] ${card.color || 'text-gray-900 dark:text-white'}`}>
          <AnimatedNumber value={card.value} />
        </h3>
        {card.badge && <span className={`text-xs font-bold ${card.badgeColor || 'text-amber-500'}`}>{card.badge}</span>}
      </div>
      <p className="text-[11px] text-gray-500 mt-2">{card.sub}</p>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Suppliers() {
  const dispatch = useDispatch();
  const { suppliers, status } = useSelector((state) => state.suppliers);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, isNew: false, data: null, errors: {} });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toasts, push: pushToast } = useToast();

  useEffect(() => {
    if (status === 'idle') dispatch(fetchSuppliers());
  }, [dispatch, status]);

  const FILTER_OPTIONS = ['All', 'Active', 'Review', 'Inactive'];

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return suppliers.filter((s) => {
      const matchSearch = !q
        || s.name.toLowerCase().includes(q)
        || (s.tileType || '').toLowerCase().includes(q)
        || (s.contactPerson || '').toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (filterStatus !== 'All') return s.status === filterStatus;
      return true;
    });
  }, [suppliers, search, filterStatus]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let active = 0, review = 0, totalOrderedQty = 0;
    suppliers.forEach((s) => {
      if (s.status === 'Active') active++;
      if (s.status === 'Review') review++;
      totalOrderedQty += s.orderedQty || 0;
    });
    return { total: suppliers.length, active, review, totalOrderedQty };
  }, [suppliers]);

  const cardDefs = [
    { label: 'Total Suppliers',    icon: 'storefront',   value: stats.total,           sub: 'Registered in your network',    color: '',                 iconColor: ''                },
    { label: 'Active Vendors',     icon: 'check_circle', value: stats.active,          sub: 'Currently approved suppliers',  color: 'text-emerald-400', iconColor: 'text-emerald-500', fill: true },
    { label: 'Under Review',       icon: 'error',        value: stats.review,          sub: 'Pending compliance check',      color: 'text-amber-400',   iconColor: 'text-amber-500', fill: true, badge: 'Review', badgeColor: 'text-amber-500' },
    { label: 'Total Ordered', icon: 'straighten', value: stats.totalOrderedQty, sub: 'Combined ordered quantity',    color: '',                 iconColor: ''                },
  ];

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['#', 'Name', 'Tile Type', 'GST', 'Contact Person', 'Phone', 'Email', 'Ordered Qty', 'Payment Terms', 'Status'];
    const rows = filtered.map((s, i) =>
      `${i + 1},"${s.name}","${s.tileType}","${s.gst}","${s.contactPerson}","${s.phone}","${s.email}",${s.orderedQty},"${s.paymentTerms}",${s.status}`
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: `suppliers_${new Date().toISOString().split('T')[0]}.csv`,
    }).click();
    URL.revokeObjectURL(url);
    pushToast('CSV exported successfully');
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (d) => {
    const e = {};
    if (!d.name?.trim())          e.name          = 'Company name is required';
    if (!d.contactPerson?.trim()) e.contactPerson = 'Contact person is required';
    if (!d.phone?.trim())         e.phone         = 'Phone number is required';
    return e;
  };

  // ── Open Add ──────────────────────────────────────────────────────────────
  const openAdd = () => setModal({
    open: true, isNew: true, errors: {},
    data: {
      name: '', tileType: 'Vitrified Tiles', gst: '',
      contactPerson: '', phone: '', email: '', orderedQty: '',
      paymentTerms: '30 Days Credit', status: 'Active',
    },
  });

  // -- Save via backend
  const handleSave = () => {
    const errs = validate(modal.data);
    if (Object.keys(errs).length) return setModal((m) => ({ ...m, errors: errs }));
    const payload = {
      name: modal.data.name, tileType: modal.data.tileType, gst: modal.data.gst,
      contactPerson: modal.data.contactPerson, phone: modal.data.phone,
      email: modal.data.email, orderedQty: Number(modal.data.orderedQty) || 0,
      paymentTerms: modal.data.paymentTerms, status: modal.data.status,
    };
    if (modal.isNew) {
      dispatch(createSupplier(payload));
      pushToast(`"${modal.data.name}" added to supplier network`);
    } else {
      dispatch(editSupplier({ id: modal.data._id, data: payload }));
      pushToast(`"${modal.data.name}" updated successfully`);
    }
    setModal({ open: false, isNew: false, data: null, errors: {} });
  };

  // -- Delete via backend
  const confirmDelete = (id) => {
    const item = suppliers.find((s) => s._id === id || String(s.id) === String(id));
    if (item) setDeleteTarget(item);
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return;
    dispatch(removeSupplier(deleteTarget._id));
    pushToast(`"${deleteTarget.name}" removed`, 'error');
    setDeleteTarget(null);
  };

  // ── Status helpers ────────────────────────────────────────────────────────
  const statusMeta = (status) => {
    if (status === 'Active')   return { dot: 'bg-emerald-500', text: 'text-emerald-400' };
    if (status === 'Review')   return { dot: 'bg-amber-500',   text: 'text-amber-400'   };
    return                            { dot: 'bg-gray-500',    text: 'text-gray-600 dark:text-gray-400'    };
  };

  return (
    <>
      <Toast toasts={toasts} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-end mb-8 font-[Manrope]">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white leading-tight mb-1">Supplier Network</h1>
          <p className="text-gray-600 dark:text-gray-400 text-[14px]">Manage tiles vendors, contacts, and active purchase orders.</p>
        </div>
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white text-[14px] font-medium hover:bg-black/10 dark:bg-white/10 transition-all rounded active:scale-[0.98]">
            <span className="material-symbols-outlined text-lg">file_download</span>
            Export CSV
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={openAdd}
            className="flex items-center gap-2 px-6 py-2.5 bg-executive-blue text-gray-900 dark:text-white text-[14px] font-medium hover:brightness-110 transition-all rounded shadow-lg shadow-executive-blue/30">
            <span className="material-symbols-outlined text-lg">add</span>
            Add Supplier
          </motion.button>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-[Manrope]">
        {cardDefs.map((card, i) => (
          <StatCard key={card.label} card={card} index={i} />
        ))}
      </div>

      {/* ── Table Panel ──────────────────────────────────────────────── */}
      <div className="glass-panel rounded-lg flex flex-col font-[Manrope] mb-8">

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-4">

          {/* Search */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px] pointer-events-none">search</span>
            <input
              type="text" placeholder="Search suppliers…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-[13px] text-gray-900 dark:text-white placeholder:text-gray-600 focus:border-executive-blue outline-none transition-all w-60 hover:border-black/20 dark:border-white/20"
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
                <circle cx="5.5" cy="4"   r="1.8" style={{ fill: 'currentColor' }} />
                <line x1="2" y1="8.5" x2="14" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="10.5" cy="8.5" r="1.8" style={{ fill: 'currentColor' }} />
                <line x1="2" y1="13"  x2="14" y2="13"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="6.5" cy="13"  r="1.8" style={{ fill: 'currentColor' }} />
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
                    className="absolute right-0 top-[calc(100%+8px)] z-20 w-44 bg-[#111114] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden"
                  >
                    {FILTER_OPTIONS.map((opt) => {
                      const active = filterStatus === opt;
                      const dotColor = { Active: 'bg-emerald-500', Review: 'bg-amber-500', Inactive: 'bg-gray-500' };
                      const txtColor = { Active: 'text-emerald-400', Review: 'text-amber-400', Inactive: 'text-gray-600 dark:text-gray-400' };
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
                          <span className={opt !== 'All' ? (txtColor[opt] || '') : ''}>{opt}</span>
                          {active && <span className="material-symbols-outlined text-[14px] text-blue-400 ml-auto">check</span>}
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
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">#</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Supplier</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Tile Type</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Contact</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Ordered Qty</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Payment</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5">Status</th>
                <th className="px-6 py-4 border-b border-black/5 dark:border-white/5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filtered.map((s, idx) => {
                  const meta = statusMeta(s.status);
                  return (
                    <motion.tr
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
                      transition={{ duration: 0.22, delay: Math.min(idx * 0.02, 0.2) }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
                      className="group transition-colors"
                    >
                      {/* Serial Number */}
                      <td className="px-6 py-4 text-xs font-mono text-executive-blue font-bold">{idx + 1}</td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:text-white transition-colors text-[18px]">storefront</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{s.name}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{s.gst || '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Tile Type */}
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{s.tileType}</td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">{s.contactPerson}</div>
                        <div className="text-[11px] text-gray-500">{s.phone}</div>
                      </td>

                      {/* Ordered Qty */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{(s.orderedQty || 0).toLocaleString()}</span>
                      </td>

                      {/* Payment Terms */}
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-semibold px-2 py-1 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300">
                          {s.paymentTerms}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <motion.div
                            className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                            animate={{ scale: s.status === 'Review' ? [1, 1.5, 1] : 1 }}
                            transition={{ repeat: s.status === 'Review' ? Infinity : 0, duration: 1.4 }}
                          />
                          <span className={`text-[11px] font-bold uppercase tracking-tighter ${meta.text}`}>{s.status}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button whileTap={{ scale: 0.85 }}
                            onClick={() => setModal({ open: true, isNew: false, data: { ...s }, errors: {} })}
                            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-white hover:bg-black/10 dark:bg-white/10 rounded transition-colors">
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.85 }}
                            onClick={() => confirmDelete(s._id || s.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-gray-500 text-sm">
                    <span className="material-symbols-outlined text-3xl block mb-2 mx-auto opacity-30">search_off</span>
                    No suppliers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-black/5 dark:border-white/5">
          <p className="text-xs text-gray-500 font-medium">
            Showing {filtered.length} of {stats.total} supplier{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal.open && (
          <SuppModal
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