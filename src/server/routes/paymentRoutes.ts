import { Router } from 'express';
import { PaymentService } from '../services/paymentService';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public configuration route (returns only the public key)
router.get('/config', (req, res) => {
  res.json({
    public_key: PaymentService.getPaystackPublicKey(),
    provider: 'PAYSTACK'
  });
});

// Initialize transaction server-side
router.post('/initialize', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { order_id, currency, callback_url } = req.body;
    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const defaultCallback = `${protocol}://${host}/checkout?order_id=${order_id}`;

    const result = await PaymentService.initializeTransaction({
      orderId: order_id,
      email: req.user!.email,
      amountUsd: 0, // Computed securely on server from order
      currency: currency || 'USD',
      callbackUrl: callback_url || defaultCallback,
      ipAddress: req.ip
    });

    res.json(result);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Verify payment server-side
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }
    const result = await PaymentService.verifyTransaction(reference);
    res.json(result);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Paystack webhook listener
router.post('/webhook', (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string || '';
    const rawBody = JSON.stringify(req.body);
    const result = PaymentService.processWebhook(signature, rawBody, req.body);
    res.status(200).json(result);
  } catch (err: unknown) {
    console.error('Paystack webhook verification failed:', err);
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
