const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

function parseOrderDate(order) {
  const candidate = order.date || order.createdAt;
  const date = candidate ? new Date(candidate) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function buildProductFinder(products) {
  const idMap = new Map();
  const nameMap = new Map();
  products.forEach((product) => {
    const id1 = String(product._id || '');
    const id2 = String(product.id || '');
    if (id1) idMap.set(id1, product);
    if (id2) idMap.set(id2, product);
    if (product.name) nameMap.set(product.name.toLowerCase(), product);
  });

  return (order) => {
    if (order.productId) {
      const byId = idMap.get(String(order.productId));
      if (byId) return byId;
    }
    if (order.tileName) {
      const byName = nameMap.get(order.tileName.toLowerCase());
      if (byName) return byName;
      const orderWords = order.tileName.toLowerCase().split(/\s+/);
      for (const product of products) {
        const productWords = product.name.toLowerCase().split(/\s+/);
        const matchCount = orderWords.filter(w => productWords.includes(w)).length;
        if (matchCount >= 2 && matchCount >= orderWords.length * 0.5) return product;
      }
    }
    return null;
  };
}

export function buildRevenueSeries(salesOrders, products, monthCount = 12) {
  const now = new Date();
  const findProduct = buildProductFinder(products);
  const buckets = [];

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleString('en-IN', { month: 'short' }),
      revenue: 0,
      cost: 0,
      profit: 0,
    });
  }

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  salesOrders.forEach((order) => {
    const date = parseOrderDate(order);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = bucketMap.get(key);

    if (!bucket) {
      return;
    }

    const revenue = Number(order.total) || 0;
    const qty = Number(order.qty) || 0;
    const product = findProduct(order);
    const unitCost = Number(product?.costPrice ?? product?.cost ?? 0);
    const cost = unitCost * qty;

    bucket.revenue += revenue;
    bucket.cost += cost;
    bucket.profit += revenue - cost;
  });

  return buckets.map((bucket) => ({
    ...bucket,
    revenue: Math.round(bucket.revenue),
    cost: Math.round(bucket.cost),
    profit: Math.round(bucket.profit),
  }));
}

export function buildCategoryDistribution(products) {
  const totals = new Map();
  let grandTotal = 0;

  products.forEach((product) => {
    const stock = Number(product.stock) || 0;
    if (stock <= 0) {
      return;
    }

    const category = product.category || 'Uncategorized';
    grandTotal += stock;
    totals.set(category, (totals.get(category) || 0) + stock);
  });

  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, quantity], index) => ({
      name,
      quantity,
      value: grandTotal ? Math.round((quantity / grandTotal) * 100) : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
}

export function buildTopProducts(salesOrders, products, limit = 5) {
  const findProduct = buildProductFinder(products);
  const aggregates = new Map();

  salesOrders.forEach((order) => {
    const key = String(order.productId || `${order.tileName}-${order.category}`);
    const current = aggregates.get(key) || {
      name: order.tileName || 'Unnamed Tile',
      category: order.category || 'Uncategorized',
      units: 0,
      revenue: 0,
    };

    const product = findProduct(order);
    current.name = product?.name || current.name;
    current.category = product?.category || current.category;
    current.units += Number(order.qty) || 0;
    current.revenue += Number(order.total) || 0;
    aggregates.set(key, current);
  });

  return Array.from(aggregates.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function attachCustomerOrderMetrics(customers, salesOrders) {
  const metrics = new Map();

  salesOrders.forEach((order) => {
    const nameKey = (order.customerName || '').trim().toLowerCase();
    const phoneKey = (order.contact || '').trim().toLowerCase();
    const revenue = Number(order.total) || 0;
    const baseMetric = { totalOrders: 0, totalSpent: 0 };

    if (nameKey) {
      const current = metrics.get(`name:${nameKey}`) || { ...baseMetric };
      current.totalOrders += 1;
      current.totalSpent += revenue;
      metrics.set(`name:${nameKey}`, current);
    }

    if (phoneKey) {
      const current = metrics.get(`phone:${phoneKey}`) || { ...baseMetric };
      current.totalOrders += 1;
      current.totalSpent += revenue;
      metrics.set(`phone:${phoneKey}`, current);
    }
  });

  return customers.map((customer) => {
    const phoneMetric = metrics.get(`phone:${(customer.phone || '').trim().toLowerCase()}`);
    const nameMetric = metrics.get(`name:${(customer.name || '').trim().toLowerCase()}`);
    const metric = phoneMetric || nameMetric || { totalOrders: 0, totalSpent: 0 };

    return {
      ...customer,
      totalOrders: metric.totalOrders,
      totalSpent: metric.totalSpent,
    };
  });
}
