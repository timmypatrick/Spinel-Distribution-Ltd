import { Router } from 'express';
import { OrderService } from '../services/orderService';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';
import { RBACService } from '../services/rbacService';

const router = Router();

// Create new order (checkout)
router.post('/checkout', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { items, shipping_address, billing_address, currency, notes, idempotency_key } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required.' });
    }
    if (!shipping_address) {
      return res.status(400).json({ error: 'Shipping address is required.' });
    }

    const order = OrderService.createOrder({
      user: req.user!,
      items,
      shippingAddress: shipping_address,
      billingAddress: billing_address || shipping_address,
      currency: currency || 'USD',
      notes,
      idempotencyKey: idempotency_key
    });

    res.status(201).json({ order });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Get user orders (RLS enforced)
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const orders = OrderService.getUserOrders(req.user!.id);
    res.json({ orders });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Get specific order details (RLS enforced)
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const isAdmin = RBACService.isAdmin(req.user!);
    const order = OrderService.getOrder(req.params.id, req.user!.id, isAdmin);
    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied.' });
    }
    res.json({ order });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Customer tracking route
router.get('/:id/track', (req, res) => {
  try {
    const order = OrderService.getOrder(req.params.id, undefined, true);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json({
      order_number: order.order_number,
      status: order.status,
      carrier: order.carrier,
      tracking_number: order.tracking_number,
      status_history: order.status_history,
      created_at: order.created_at,
      updated_at: order.updated_at
    });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
