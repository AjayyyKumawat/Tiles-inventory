import express from 'express';
import mongoose from 'mongoose';
import { getDbModels } from '../middleware/dbSelector.js';

const router = express.Router();

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function findProductForOrder(orderLike, ProductModel, session) {
  let query = null;

  if (orderLike.productId) {
    query = { _id: orderLike.productId };
  } else if (orderLike.tileName) {
    query = {
      name: orderLike.tileName,
      ...(orderLike.category ? { category: orderLike.category } : {}),
    };
  }

  if (!query) {
    return null;
  }

  return ProductModel.findOne(query).session(session);
}

function createAuditEntry({ action, product, prevQty, newQty, order, note }) {
  const boxLabel = Number(order.qty) === 1 ? 'box' : 'boxes';

  return {
    action,
    productId: product._id,
    productName: product.name,
    prevQty,
    newQty,
    admin: 'Sales Order Workflow',
    note:
      note ||
      `${order.customerName} ordered ${order.qty} ${boxLabel} (${order.status || 'Pending'})`,
    timestamp: new Date(),
  };
}

function sanitizeOrderPayload(input, fallback = {}) {
  return {
    ...fallback,
    ...input,
    qty: Number(input.qty ?? fallback.qty ?? 0),
    total: Number(input.total ?? fallback.total ?? 0),
  };
}

function ensurePositiveQuantity(order) {
  if (!Number.isFinite(order.qty) || order.qty < 1) {
    throw createHttpError(400, 'Order quantity must be at least 1 box.');
  }
}

function ensureNonNegativeTotal(order) {
  if (!Number.isFinite(order.total) || order.total < 0) {
    throw createHttpError(400, 'Order total must be 0 or greater.');
  }
}

function formatStockError(product) {
  const boxLabel = product.stock === 1 ? 'box' : 'boxes';
  return `Insufficient stock for "${product.name}". Only ${product.stock} ${boxLabel} available.`;
}

function toClientOrder(order) {
  const obj = order.toObject();
  return { ...obj, id: obj.orderId || obj._id };
}

// GET all sales orders
router.get('/', async (req, res) => {
  try {
    const { SalesOrder } = getDbModels(req);
    const orders = await SalesOrder.find({}).sort({ createdAt: -1 });
    res.json(orders.map(toClientOrder));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create sales order and reserve stock
router.post('/', async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let responsePayload;
    const { SalesOrder, Product, AuditLog } = getDbModels(req);

    await session.withTransaction(async () => {
      const incomingOrder = sanitizeOrderPayload(req.body);
      ensurePositiveQuantity(incomingOrder);
      ensureNonNegativeTotal(incomingOrder);

      const product = await findProductForOrder(incomingOrder, Product, session);
      if (!product) {
        throw createHttpError(404, 'Selected tile was not found in inventory.');
      }
      if (product.stock < incomingOrder.qty) {
        throw createHttpError(400, formatStockError(product));
      }

      const prevQty = product.stock;
      product.stock -= incomingOrder.qty;
      await product.save({ session });

      const lastOrder = await SalesOrder.findOne({}, {}, { sort: { orderId: -1 } }).session(session);
      const nextOrderId = lastOrder && lastOrder.orderId ? lastOrder.orderId + 1 : 1;

      const orderPayload = {
        ...incomingOrder,
        orderId: nextOrderId,
        productId: product._id,
        tileName: product.name,
        category: incomingOrder.category || product.category,
      };

      const [savedOrder] = await SalesOrder.create([orderPayload], { session });
      await AuditLog.create(
        [
          createAuditEntry({
            action: 'Order Created',
            product,
            prevQty,
            newQty: product.stock,
            order: orderPayload,
            note: `Created order for ${orderPayload.customerName} (${orderPayload.qty} boxes)`,
          }),
        ],
        { session }
      );

      responsePayload = toClientOrder(savedOrder);
    });

    res.status(201).json(responsePayload);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
});

// PUT update sales order and rebalance stock
router.put('/:id', async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let responsePayload;
    const { SalesOrder, Product, AuditLog } = getDbModels(req);

    await session.withTransaction(async () => {
      const existingOrder = await SalesOrder.findById(req.params.id).session(session);
      if (!existingOrder) {
        throw createHttpError(404, 'Sales order not found.');
      }

      const nextOrder = sanitizeOrderPayload(req.body, existingOrder.toObject());
      ensurePositiveQuantity(nextOrder);
      ensureNonNegativeTotal(nextOrder);

      const oldProduct = await findProductForOrder(existingOrder.toObject(), Product, session);
      const newProduct = await findProductForOrder(nextOrder, Product, session);

      if (!oldProduct || !newProduct) {
        throw createHttpError(404, 'Unable to resolve inventory item for this order.');
      }

      const sameProduct = String(oldProduct._id) === String(newProduct._id);
      const auditEntries = [];

      if (sameProduct) {
        const prevQty = oldProduct.stock;
        const availableStock = oldProduct.stock + existingOrder.qty;

        if (availableStock < nextOrder.qty) {
          throw createHttpError(400, formatStockError({ ...oldProduct.toObject(), stock: availableStock }));
        }

        oldProduct.stock = availableStock - nextOrder.qty;
        await oldProduct.save({ session });

        if (oldProduct.stock !== prevQty) {
          auditEntries.push(
            createAuditEntry({
              action: 'Order Updated',
              product: oldProduct,
              prevQty,
              newQty: oldProduct.stock,
              order: nextOrder,
              note: `Updated order for ${nextOrder.customerName} (${nextOrder.qty} boxes)`,
            })
          );
        }
      } else {
        const oldPrevQty = oldProduct.stock;
        oldProduct.stock += existingOrder.qty;
        await oldProduct.save({ session });
        auditEntries.push(
          createAuditEntry({
            action: 'Order Updated',
            product: oldProduct,
            prevQty: oldPrevQty,
            newQty: oldProduct.stock,
            order: existingOrder.toObject(),
            note: `Restored stock after moving order for ${existingOrder.customerName}`,
          })
        );

        if (newProduct.stock < nextOrder.qty) {
          throw createHttpError(400, formatStockError(newProduct));
        }

        const newPrevQty = newProduct.stock;
        newProduct.stock -= nextOrder.qty;
        await newProduct.save({ session });
        auditEntries.push(
          createAuditEntry({
            action: 'Order Updated',
            product: newProduct,
            prevQty: newPrevQty,
            newQty: newProduct.stock,
            order: nextOrder,
            note: `Applied updated order for ${nextOrder.customerName} (${nextOrder.qty} boxes)`,
          })
        );
      }

      Object.assign(existingOrder, {
        ...nextOrder,
        productId: newProduct._id,
        tileName: newProduct.name,
        category: nextOrder.category || newProduct.category,
      });

      const savedOrder = await existingOrder.save({ session });

      if (auditEntries.length) {
        await AuditLog.create(auditEntries, { session });
      }

      responsePayload = toClientOrder(savedOrder);
    });

    res.json(responsePayload);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
});

// DELETE sales order and restore stock
router.delete('/:id', async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { SalesOrder, Product, AuditLog } = getDbModels(req);
    await session.withTransaction(async () => {
      const existingOrder = await SalesOrder.findById(req.params.id).session(session);
      if (!existingOrder) {
        throw createHttpError(404, 'Sales order not found.');
      }

      const product = await findProductForOrder(existingOrder.toObject(), Product, session);
      if (!product) {
        throw createHttpError(404, 'Unable to resolve inventory item for this order.');
      }

      const prevQty = product.stock;
      product.stock += existingOrder.qty;
      await product.save({ session });

      await AuditLog.create(
        [
          createAuditEntry({
            action: 'Order Deleted',
            product,
            prevQty,
            newQty: product.stock,
            order: existingOrder.toObject(),
            note: `Deleted order for ${existingOrder.customerName} and restored ${existingOrder.qty} boxes`,
          }),
        ],
        { session }
      );

      await existingOrder.deleteOne({ session });
    });

    res.json({ message: 'Order removed and stock restored.' });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
});

export default router;
