import { Router } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Please provide email, password, first name, and last name.' });
    }
    const result = await AuthService.register({ email, password, first_name, last_name, phone });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await AuthService.login({ email, password });
    res.json(result);
  } catch (err: unknown) {
    res.status(401).json({ error: (err as Error).message });
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await AuthService.updateProfile(req.user!.id, req.body);
    res.json({ user: updated });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get('/addresses', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const addresses = await AuthService.getAddresses(req.user!.id);
    res.json({ addresses });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/addresses', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const newAddress = await AuthService.addAddress(req.user!.id, req.body);
    res.status(201).json({ address: newAddress });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
