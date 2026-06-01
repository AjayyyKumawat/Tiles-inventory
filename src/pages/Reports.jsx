import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/slices/inventorySlice';
import { fetchSalesOrders } from '../store/slices/salesOrdersSlice';
import { buildRevenueSeries, buildTopProducts } from '../utils/analytics';

const PERIOD_CONFIG = {
  'Last 30 Days': { days: 30, months: 2 },
  'Last 3 Months': { monthsBack: 3, months: 3 },
  'Last 12 Months': { monthsBack: 12, months: 12 },
  'Year to Date': { yearToDate: true, months: new Date().getMonth() + 1 },
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);

function filterOrdersByPeriod(orders, period) {
  const config = PERIOD_CONFIG[period];
  const now = new Date();

  return orders.filter((order) => {
    const candidate = order.date || order.createdAt;
    const date = candidate ? new Date(candidate) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return false;
    }

    if (config.days) {
      const start = new Date(now);
      start.setDate(now.getDate() - config.days);
      return date >= start;
    }

    if (config.yearToDate) {
      return date.getFullYear() === now.getFullYear();
    }

    const start = new Date(now.getFullYear(), now.getMonth() - (config.monthsBack - 1), 1);
    return date >= start;
  });
}

export default function Reports() {
  const dispatch = useDispatch();
  const [period, setPeriod] = useState('Last 12 Months');
  const { products, status: inventoryStatus } = useSelector((state) => state.inventory);
  const { salesOrders, status: salesOrderStatus } = useSelector((state) => state.salesOrders);

  useEffect(() => {
    if (inventoryStatus === 'idle') {
      dispatch(fetchProducts());
    }

    if (salesOrderStatus === 'idle') {
      dispatch(fetchSalesOrders());
    }
  }, [dispatch, inventoryStatus, salesOrderStatus]);

  const filteredOrders = useMemo(
    () => filterOrdersByPeriod(salesOrders, period),
    [salesOrders, period]
  );

  const revenueData = useMemo(() => {
    const monthCount = PERIOD_CONFIG[period].months;
    return buildRevenueSeries(filteredOrders, products, monthCount);
  }, [filteredOrders, products, period]);

  const topProducts = useMemo(
    () => buildTopProducts(filteredOrders, products, 6),
    [filteredOrders, products]
  );

  const summary = useMemo(() => {
    const productLookup = new Map(products.map((product) => [String(product._id || product.id), product]));
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const totalCosts = filteredOrders.reduce((sum, order) => {
      let product = productLookup.get(String(order.productId || ''));
      if (!product && order.tileName) {
        product = products.find(p => p.name.toLowerCase() === order.tileName.toLowerCase());
      }
      return sum + ((Number(product?.costPrice ?? product?.cost) || 0) * (Number(order.qty) || 0));
    }, 0);
    const netProfit = totalRevenue - totalCosts;
    const avgMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCosts,
      netProfit,
      avgMargin,
    };
  }, [filteredOrders, products]);

  const chartMax = Math.max(
    60000,
    ...revenueData.flatMap((entry) => [entry.revenue, entry.cost])
  );

  return (
    <>
      <div className="flex justify-between items-end mb-8 font-[Manrope]">
        <div>
          <h1 className="text-[32px] font-bold text-gray-900 dark:text-white leading-tight mb-1">Financial & Performance Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 text-[14px]">Live revenue, cost, and product performance analytics from your backend data.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2.5 bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white text-[14px] font-medium transition-all rounded outline-none focus:border-executive-blue"
          >
            {Object.keys(PERIOD_CONFIG).map((option) => (
              <option key={option} className="bg-white dark:bg-charcoal">
                {option}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white text-[14px] font-medium hover:bg-black/10 dark:bg-white/10 transition-all rounded active:scale-[0.98]">
            <span className="material-symbols-outlined text-lg">analytics</span>
            Live Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-[Manrope]">
        <div className="glass-panel p-6 rounded-lg card-light-source">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Total Revenue</span>
            <span className="material-symbols-outlined text-gray-500 text-lg">payments</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[48px] font-bold text-gray-900 dark:text-white leading-[1.1] tracking-[-0.02em]">{formatCurrency(summary.totalRevenue)}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Sales order value for {period.toLowerCase()}</p>
        </div>
        <div className="glass-panel p-6 rounded-lg card-light-source">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Total Costs</span>
            <span className="material-symbols-outlined text-gray-500 text-lg">account_balance_wallet</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[48px] font-bold text-gray-900 dark:text-white leading-[1.1] tracking-[-0.02em]">{formatCurrency(summary.totalCosts)}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Estimated from tile cost price and sold quantity</p>
        </div>
        <div className="glass-panel p-6 rounded-lg card-light-source border-l-emerald-500/40">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Net Profit</span>
            <span className="material-symbols-outlined text-emerald-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[48px] font-bold text-gray-900 dark:text-white leading-[1.1] tracking-[-0.02em]">{formatCurrency(summary.netProfit)}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Revenue minus estimated cost of goods sold</p>
        </div>
        <div className="glass-panel p-6 rounded-lg card-light-source">
          <div className="flex justify-between items-start mb-4">
            <span className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Avg Margin</span>
            <span className="material-symbols-outlined text-gray-500 text-lg">percent</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[48px] font-bold text-gray-900 dark:text-white leading-[1.1] tracking-[-0.02em]">{summary.avgMargin.toFixed(1)}%</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Profitability across filtered orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-[Manrope] mb-8">
        <div className="lg:col-span-2 glass-panel p-6 rounded-lg">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[24px] font-bold text-gray-900 dark:text-white">Revenue vs Cost Analysis</h2>
            <span className="material-symbols-outlined text-gray-500">sync_alt</span>
          </div>
          <div className="h-[300px] flex items-end justify-between gap-2 pb-4 border-b border-black/10 dark:border-white/10 relative">
            <div className="absolute left-0 top-0 bottom-0 w-full flex flex-col justify-between text-[10px] text-gray-600 font-mono pb-4 z-0 pointer-events-none">
              {[1, 0.75, 0.5, 0.25, 0].map((multiplier) => (
                <div key={multiplier} className="flex items-center gap-2 w-full">
                  <span className="w-12 text-right">{formatCurrency(chartMax * multiplier)}</span>
                  <div className="h-[1px] w-full bg-black/5 dark:bg-white/5" />
                </div>
              ))}
            </div>

            {revenueData.map((entry) => {
              const revenueHeight = chartMax ? (entry.revenue / chartMax) * 100 : 0;
              const costHeight = chartMax ? (entry.cost / chartMax) * 100 : 0;

              return (
                <div key={`${entry.key}-${entry.month}`} className="flex flex-col items-center gap-2 z-10 w-full group">
                  <div className="relative w-full h-[250px] flex justify-center items-end gap-1">
                    <div className="w-1/3 bg-executive-blue/80 rounded-t-sm hover:bg-executive-blue transition-colors relative group" style={{ height: `${revenueHeight}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-charcoal text-gray-900 dark:text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 border border-black/10 dark:border-white/10">
                        Rev: {formatCurrency(entry.revenue)}
                      </div>
                    </div>
                    <div className="w-1/3 bg-indigo-500/40 rounded-t-sm hover:bg-indigo-500/60 transition-colors relative group" style={{ height: `${costHeight}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-charcoal text-gray-900 dark:text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 border border-black/10 dark:border-white/10">
                        Cost: {formatCurrency(entry.cost)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{entry.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-executive-blue" /><span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Revenue</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500/40" /><span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Cost</span></div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-lg flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[24px] font-bold text-gray-900 dark:text-white">Top Performers</h2>
            <span className="material-symbols-outlined text-gray-500">trophy</span>
          </div>
          <div className="space-y-4 flex-1">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={`${product.name}-${index}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-black/5 dark:bg-white/5 transition-colors group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:text-executive-blue transition-colors">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">{product.name}</h4>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{product.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</div>
                    <div className="text-[11px] text-gray-500">{product.units} units sold</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-theme-textSub">No order data available for the selected period.</div>
            )}
          </div>
          <div className="w-full mt-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold rounded text-center">
            {filteredOrders.length} orders analyzed
          </div>
        </div>
      </div>
    </>
  );
}
