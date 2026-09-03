import { Router } from 'express';
import { CartService } from '../services/cartService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

router.get('/', (req: AuthenticatedRequest, res) => {
  try {
    const cartId = (req.headers['x-cart-id'] as string) || (req.query.cart_id as string);
    const cart = CartService.getOrCreateCart(cartId, req.user?.id);
    res.json({ cart });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/add', (req: AuthenticatedRequest, res) => {
  try {
    const { cart_id, product_id, quantity } = req.body;
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }
    const cart = CartService.addItem(cart_id, product_id, Number(quantity) || 1, req.user?.id);
    res.json({ cart });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/update', (req: AuthenticatedRequest, res) => {
  try {
    const { cart_id, product_id, quantity } = req.body;
    if (!cart_id || !product_id) {
      return res.status(400).json({ error: 'cart_id and product_id are required' });
    }
    const cart = CartService.updateQuantity(cart_id, product_id, Number(quantity), req.user?.id);
    res.json({ cart });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/remove', (req: AuthenticatedRequest, res) => {
  try {
    const { cart_id, product_id } = req.body;
    if (!cart_id || !product_id) {
      return res.status(400).json({ error: 'cart_id and product_id are required' });
    }
    const cart = CartService.removeItem(cart_id, product_id, req.user?.id);
    res.json({ cart });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/clear', (req, res) => {
  try {
    const { cart_id } = req.body;
    if (!cart_id) {
      return res.status(400).json({ error: 'cart_id is required' });
    }
    const cart = CartService.clearCart(cart_id);
    res.json({ cart });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
