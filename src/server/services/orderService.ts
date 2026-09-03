import crypto from 'crypto';
import { db } from '../db/schema';
import { Order, OrderItem, OrderStatus, Address, UserProfile } from '../../types';
import { InventoryService } from './inventoryService';
import { InvoiceService } from './invoiceService';

export class OrderService {
  static createOrder(params: {
    user: UserProfile;
    items: { productId: string; quantity: number }[];
    shippingAddress: Address;
    billingAddress: Address;
    currency?: 'USD' | 'NGN';
    notes?: string;
    idempotencyKey?: string;
  }): Order {
    // Check idempotency
    if (params.idempotencyKey && db.idempotencyKeys.has(params.idempotencyKey)) {
      return db.idempotencyKeys.get(params.idempotencyKey)!.result as Order;
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('Cannot create order with an empty cart');
    }

    // Retrieve products and calculate authoritative total server-side
    let subtotalUsd = 0;
    const orderItems: OrderItem[] = [];
    const orderId = crypto.randomUUID();
    const orderNumber = `SPINEL-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    for (const reqItem of params.items) {
      const product = db.products.get(reqItem.productId);
      if (!product || product.status !== 'ACTIVE') {
        throw new Error(`Product ${reqItem.productId} is unavailable`);
      }

      const inv = db.inventory.get(reqItem.productId);
      const available = inv ? inv.quantity_available : product.stock_quantity;
      if (available < reqItem.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${available}`);
      }

      const itemTotal = product.price_usd * reqItem.quantity;
      subtotalUsd += itemTotal;

      orderItems.push({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        image: product.image,
        quantity: reqItem.quantity,
        unit_price_usd: product.price_usd,
        total_price_usd: Math.round(itemTotal * 100) / 100
      });

      // Temporarily reserve stock
      InventoryService.reserveStock(product.id, reqItem.quantity, orderNumber);
    }

    const exchangeRate = db.settings.exchange_rate_usd_to_ngn || 1500;
    const shippingUsd = 0.00; // Free shipping
    const discountUsd = 0.00;
    const totalUsd = Math.round((subtotalUsd + shippingUsd - discountUsd) * 100) / 100;
    const totalNgn = Math.round(totalUsd * exchangeRate * 100) / 100;

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: params.user.id,
      customer_name: `${params.user.first_name} ${params.user.last_name}`.trim(),
      customer_email: params.user.email,
      status: 'PENDING_PAYMENT',
      subtotal_usd: subtotalUsd,
      shipping_usd: shippingUsd,
      discount_usd: discountUsd,
      total_usd: totalUsd,
      currency: params.currency || 'USD',
      exchange_rate: exchangeRate,
      total_charged_ngn: totalNgn,
      shipping_address: params.shippingAddress,
      billing_address: params.billingAddress,
      notes: params.notes,
      items: orderItems,
      status_history: [
        {
          id: crypto.randomUUID(),
          order_id: orderId,
          to_status: 'PENDING_PAYMENT',
          comment: 'Order placed, awaiting Paystack payment transaction',
          created_at: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.orders.set(orderId, newOrder);

    // Save idempotency key
    if (params.idempotencyKey) {
      db.idempotencyKeys.set(params.idempotencyKey, {
        result: newOrder,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      });
    }

    // Audit log
    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: params.user.id,
      user_email: params.user.email,
      action: 'ORDER_PLACED',
      entity: 'orders',
      entity_id: orderId,
      metadata: { order_number: orderNumber, total_usd: totalUsd },
      created_at: new Date().toISOString()
    });

    return newOrder;
  }

  static getOrder(orderId: string, userId?: string, isAdmin: boolean = false): Order | null {
    const order = db.orders.get(orderId) || Array.from(db.orders.values()).find(o => o.order_number === orderId);
    if (!order) return null;

    // RLS Enforcement: Normal customers can only access their own order
    if (!isAdmin && userId && order.user_id !== userId) {
      return null;
    }

    return order;
  }

  static getUserOrders(userId: string): Order[] {
    return Array.from(db.orders.values())
      .filter(o => o.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static getAllOrders(): Order[] {
    return Array.from(db.orders.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static updateOrderStatus(orderId: string, newStatus: OrderStatus, comment: string, changedByUserId?: string): Order {
    const order = db.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    const previousStatus = order.status;
    if (previousStatus === newStatus) return order;

    order.status = newStatus;
    order.updated_at = new Date().toISOString();

    if (newStatus === 'SHIPPED' && !order.tracking_number) {
      order.carrier = 'DHL Express';
      order.tracking_number = `DHL-${Math.floor(100000000 + Math.random() * 900000000)}`;
    }

    order.status_history.push({
      id: crypto.randomUUID(),
      order_id: order.id,
      from_status: previousStatus,
      to_status: newStatus,
      comment,
      changed_by: changedByUserId,
      created_at: new Date().toISOString()
    });

    // If order was cancelled/failed, release reservations
    if (['CANCELLED', 'FAILED'].includes(newStatus) && ['PENDING_PAYMENT', 'PAYMENT_PROCESSING'].includes(previousStatus)) {
      for (const item of order.items) {
        InventoryService.releaseReservation(item.product_id, item.quantity, order.order_number);
      }
    }

    // If order transition to PAID, commit inventory sales & generate invoice
    if (newStatus === 'PAID' && previousStatus !== 'PAID') {
      for (const item of order.items) {
        InventoryService.commitSale(item.product_id, item.quantity, order.order_number);
      }
      InvoiceService.generateInvoiceForOrder(order);
    }

    db.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: changedByUserId,
      action: 'ORDER_STATUS_CHANGED',
      entity: 'orders',
      entity_id: orderId,
      metadata: { from: previousStatus, to: newStatus, order_number: order.order_number },
      created_at: new Date().toISOString()
    });

    return order;
  }
}
