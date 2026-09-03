import { Router } from 'express';
import { InvoiceService } from '../services/invoiceService';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';
import { RBACService } from '../services/rbacService';

const router = Router();

// Get customer invoices (RLS enforced)
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const isAdmin = RBACService.isAdmin(req.user!);
    const invoices = isAdmin ? InvoiceService.getAllInvoices() : InvoiceService.getUserInvoices(req.user!.id);
    res.json({ invoices });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Get single invoice
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const isAdmin = RBACService.isAdmin(req.user!);
    const invoice = InvoiceService.getInvoice(req.params.id, req.user!.id, isAdmin);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized access.' });
    }
    res.json({ invoice });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
