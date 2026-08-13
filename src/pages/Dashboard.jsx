import { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchProducts } from '../store/slices/inventorySlice';
import { fetchSalesOrders } from '../store/slices/salesOrdersSlice';
import { buildCategoryDistribution, buildRevenueSeries } from '../utils/analytics';
import { motion } from 'framer-motion';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

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

function RevenueTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg shadow-xl border border-white/10 text-sm">
        <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }

  return null;
}

function CategoryTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg shadow-xl border border-white/10 text-sm flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: payload[0].payload.color }}
        />
        <p className="font-bold text-gray-900 dark:text-white">
          {payload[0].name}: {payload[0].payload.quantity} units
        </p>
      </div>
    );
  }

  return null;
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products: inventory, status: inventoryStatus } = useSelector((state) => state.inventory);
  const { salesOrders, status: salesOrderStatus } = useSelector((state) => state.salesOrders);

  useEffect(() => {
    if (inventoryStatus === 'idle') {
      dispatch(fetchProducts());
    }

    if (salesOrderStatus === 'idle') {
      dispatch(fetchSalesOrders());
    }
  }, [dispatch, inventoryStatus, salesOrderStatus]);

  const totalItems = useMemo(
    () => inventory.reduce((sum, item) => sum + (Number(item.stock) || 0), 0),
    [inventory]
  );
  const lowStockItems = useMemo(
    () => inventory.filter((item) => (Number(item.stock) || 0) <= (Number(item.reorderPoint) || 0)),
    [inventory]
  );
  const activeSOs = useMemo(
    () => salesOrders.filter((order) => order.status !== 'Delivered').length,
    [salesOrders]
  );
  const totalSales = useMemo(
    () => salesOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    [salesOrders]
  );
  const revenueData = useMemo(
    () => buildRevenueSeries(salesOrders, inventory, 12),
    [salesOrders, inventory]
  );
  const categoryData = useMemo(
    () => buildCategoryDistribution(inventory),
    [inventory]
  );

  return (
    <div className="font-[Manrope] text-gray-900 dark:text-white">
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-4xl md:text-[48px] leading-[1.1] font-bold text-gray-900 dark:text-white tracking-[-0.02em]">
              Dashboard Overview
            </h2>
            <p className="text-[16px] text-theme-textSub mt-2">
              Live operational metrics pulled from your current backend data
            </p>
          </div>
          <button className="bg-theme-blue hover:bg-theme-blue/90 text-white px-6 py-2.5 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 shadow-lg shadow-theme-blue/20 transition-colors">
            <span className="material-symbols-outlined text-sm">cloud_done</span>
            Live Sync
          </button>
        </div>

        {lowStockItems.length > 0 && (
          <div className="glass-panel border-l-4 border-theme-amber p-5 flex flex-col sm:flex-row sm:items-center justify-between rounded-xl gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-theme-amber/10 flex items-center justify-center border border-theme-amber/20 shrink-0">
                <span className="material-symbols-outlined text-theme-amber">warning</span>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Critical Inventory Alert</p>
                <p className="text-sm text-theme-textSub">
                  {lowStockItems.length} items have fallen below safety stock levels.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/inventory')}
                className="text-sm text-theme-amber font-semibold hover:underline shrink-0"
              >
                Review Items
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          custom={0}
          className="glass-panel executive-gradient p-6 rounded-2xl relative overflow-hidden cursor-default"
        >
          <p className="text-[12px] text-theme-textSub uppercase tracking-wider font-semibold mb-2">Booked Sales Value</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[32px] font-semibold text-gray-900 dark:text-white leading-tight">
              <AnimatedNumber value={totalSales} formatter={formatCurrency} />
            </h3>
            <span className="text-theme-green text-xs font-medium flex items-center gap-1">
              <motion.span variants={iconVariants} className="material-symbols-outlined text-xs">database</motion.span>
              {salesOrders.length} orders
            </span>
          </div>
          <div className="mt-4 h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-theme-blue shadow-[0_0_8px_var(--color-theme-blue)]"
              style={{ width: `${Math.min(100, salesOrders.length * 8)}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          custom={1}
          className="glass-panel executive-gradient p-6 rounded-2xl relative overflow-hidden cursor-default"
        >
          <p className="text-[12px] text-theme-textSub uppercase tracking-wider font-semibold mb-2">Inventory On Hand</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[32px] font-semibold text-gray-900 dark:text-white leading-tight">
              <AnimatedNumber value={totalItems} />
            </h3>
            <span className="text-theme-textSub text-xs font-medium">units</span>
          </div>
          <div className="mt-4 flex gap-1">
            <div className="h-1 flex-1 bg-theme-blue rounded-full origin-left" />
            <div className="h-1 flex-1 bg-theme-blue/60 rounded-full origin-left" />
            <div className="h-1 flex-1 bg-theme-blue/30 rounded-full origin-left" />
            <div className="h-1 flex-1 bg-black/5 dark:bg-white/5 rounded-full" />
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          custom={2}
          className="glass-panel executive-gradient p-6 rounded-2xl relative overflow-hidden cursor-default"
        >
          <p className="text-[12px] text-theme-textSub uppercase tracking-wider font-semibold mb-2">Open Sales Orders</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[32px] font-semibold text-gray-900 dark:text-white leading-tight">
              <AnimatedNumber value={activeSOs} />
            </h3>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1a1a1a] bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] text-gray-900 dark:text-white backdrop-blur-sm z-30">SO</div>
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1a1a1a] bg-theme-blue flex items-center justify-center text-[10px] text-white z-20">DB</div>
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-[#1a1a1a] bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] text-theme-textSub backdrop-blur-sm z-10">+{salesOrders.length}</div>
            </div>
            <p className="text-[10px] text-theme-textSub font-medium uppercase">{salesOrders.length} Total Orders</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl md:text-[24px] font-semibold text-gray-900 dark:text-white">Revenue Overview</h4>
              <p className="text-sm text-theme-textSub">Monthly sales value derived from live orders</p>
            </div>
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
              <button className="px-4 py-1.5 text-xs font-medium bg-white dark:bg-white/10 shadow-sm dark:shadow-none text-gray-900 dark:text-white rounded-lg">
                Monthly
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis hide />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'rgba(150, 150, 150, 0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col">
          <div className="mb-6">
            <h4 className="text-xl md:text-[24px] font-semibold text-gray-900 dark:text-white">Stock by Category</h4>
            <p className="text-sm text-theme-textSub">Current backend inventory distribution</p>
          </div>

          <div className="flex-grow flex items-center justify-center relative min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CategoryTooltip />} />
                <Pie
                  data={categoryData}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[28px] font-bold text-gray-900 dark:text-white leading-none">
                {categoryData.length ? '100%' : '0%'}
              </p>
              <p className="text-[10px] text-theme-textSub uppercase tracking-widest mt-1">Volume</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {categoryData.length > 0 ? (
              categoryData.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color, boxShadow: `0 0 8px ${category.color}60` }} />
                    <span className="text-[13px] font-medium text-theme-textSub">{category.name}</span>
                  </div>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white">{category.value}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-theme-textSub">No inventory data available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
