import { Router } from 'express';
import { AuthenticatedRequest, requireAdmin, requirePermission } from '../middleware/authMiddleware';
import { ProductService } from '../services/productService';
import { InventoryService } from '../services/inventoryService';
import { OrderService } from '../services/orderService';
import { ImportService } from '../services/importService';
import { SettingsService } from '../services/settingsService';
import { AuditService } from '../services/auditService';
import { RBACService } from '../services/rbacService';
import { db } from '../db/schema';
import { RoleName } from '../../types';

const router = Router();

// Protect ALL /api/admin routes: Must be authenticated and have an admin/manager role
router.use(requireAdmin);

// 1. Dashboard Statistics (Efficient DB-level aggregation)
router.get('/stats', requirePermission('catalog.read'), (req: AuthenticatedRequest, res) => {
  try {
    const stats = ProductService.getCatalogueStats();
    res.json({ stats });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 2. Products Management
router.get('/products', requirePermission('catalog.read'), (req: AuthenticatedRequest, res) => {
  try {
    const result = ProductService.getAdminProducts(req.query as any);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/products', requirePermission('catalog.create'), (req: AuthenticatedRequest, res) => {
  try {
    const product = ProductService.createProduct(req.body, req.user?.id);
    res.status(201).json({ product });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put('/products/:id', requirePermission('catalog.update'), (req: AuthenticatedRequest, res) => {
  try {
    const updated = ProductService.updateProduct(req.params.id, req.body, req.user?.id);
    res.json({ product: updated });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete('/products/:id', requirePermission('catalog.delete'), (req: AuthenticatedRequest, res) => {
  try {
    const success = ProductService.deleteProduct(req.params.id, req.user?.id);
    res.json({ success });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// 3. Inventory & Movements
router.get('/inventory', requirePermission('catalog.read'), (req: AuthenticatedRequest, res) => {
  try {
    const inventory = InventoryService.getAllInventory();
    const movements = InventoryService.getMovements();
    res.json({ inventory, movements });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/inventory/adjust', requirePermission('catalog.update'), (req: AuthenticatedRequest, res) => {
  try {
    const { product_id, new_quantity, reason } = req.body;
    if (!product_id || new_quantity === undefined) {
      return res.status(400).json({ error: 'product_id and new_quantity are required' });
    }
    const inv = InventoryService.adjustStock(product_id, Number(new_quantity), reason || 'Admin manual adjustment', req.user?.id);
    res.json({ inventory: inv });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// 4. Orders Management
router.get('/orders', requirePermission('orders.read'), (req: AuthenticatedRequest, res) => {
  try {
    const orders = OrderService.getAllOrders();
    res.json({ orders });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/orders/:id/status', requirePermission('orders.update'), (req: AuthenticatedRequest, res) => {
  try {
    const { status, comment } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    const order = OrderService.updateOrderStatus(req.params.id, status, comment || `Status changed to ${status}`, req.user?.id);
    res.json({ order });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// 5. Bulk Import Engine & Google AI Studio Import Support (Section 22 & 23)
router.get('/imports', requirePermission('catalog.import'), (req: AuthenticatedRequest, res) => {
  try {
    const jobs = ImportService.getAllJobs();
    res.json({ jobs });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/imports/template', requirePermission('catalog.import'), (req: AuthenticatedRequest, res) => {
  try {
    const format = (req.query.format as 'csv' | 'xlsx') || 'csv';
    const template = ImportService.generateTemplate(format);
    res.setHeader('Content-Type', template.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${template.fileName}"`);
    res.send(template.data);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/imports/create', requirePermission('catalog.import'), (req: AuthenticatedRequest, res) => {
  try {
    const { file_name, file_size } = req.body;
    if (!file_name) return res.status(400).json({ error: 'file_name is required' });
    const job = ImportService.createJob({
      fileName: file_name,
      filePath: `/imports/${file_name}`,
      fileSize: file_size || 1024,
      createdBy: req.user?.id
    });
    res.status(201).json({ job });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/imports/:id/start', requirePermission('catalog.import'), async (req: AuthenticatedRequest, res) => {
  try {
    const { raw_content, file_type } = req.body;
    if (!raw_content) {
      return res.status(400).json({ error: 'raw_content is required to begin processing' });
    }
    const job = await ImportService.startProcessingJob(
      req.params.id,
      raw_content,
      file_type === 'xlsx' ? 'xlsx' : 'csv'
    );
    res.json({ job });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post('/imports/:id/cancel', requirePermission('catalog.import'), (req: AuthenticatedRequest, res) => {
  try {
    const job = ImportService.cancelJob(req.params.id, req.user?.id);
    res.json({ job });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get('/imports/:id', requirePermission('catalog.import'), (req: AuthenticatedRequest, res) => {
  try {
    const job = ImportService.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Import job not found' });
    const errors = ImportService.getJobErrors(req.params.id);
    res.json({ job, errors });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/imports/:id/error-report', requirePermission('catalog.import'), (req: AuthenticatedRequest, res) => {
  try {
    const csv = ImportService.generateErrorReportCsv(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="import_errors_${req.params.id}.csv"`);
    res.send(csv);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 6. Users and Roles
router.get('/users', requirePermission('users.read'), (req: AuthenticatedRequest, res) => {
  try {
    const users = Array.from(db.users.values()).map(u => {
      const { password_hash, ...safe } = u;
      return safe;
    });
    res.json({ users });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/users/:id/roles', requirePermission('users.update'), (req: AuthenticatedRequest, res) => {
  try {
    const targetUser = db.users.get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const { roles } = req.body as { roles: RoleName[] };
    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ error: 'roles array is required' });
    }

    // Privilege escalation protection
    if (!RBACService.validatePrivilegeEscalation(req.user!, roles)) {
      return res.status(403).json({ error: 'Privilege escalation rejected: Only a super_admin can assign super_admin role.' });
    }

    targetUser.roles = roles;
    targetUser.updated_at = new Date().toISOString();

    AuditService.log({
      userId: req.user?.id,
      action: 'USER_ROLES_UPDATED',
      entity: 'profiles',
      entityId: targetUser.id,
      metadata: { target_email: targetUser.email, new_roles: roles }
    });

    const { password_hash, ...safe } = targetUser;
    res.json({ user: safe });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// 7. Audit Logs
router.get('/audit-logs', requirePermission('settings.read'), (req: AuthenticatedRequest, res) => {
  try {
    const logs = AuditService.getLogs(Number(req.query.limit) || 100);
    res.json({ logs });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 8. System Settings & Currency Configuration
router.get('/settings', (req, res) => {
  try {
    const settings = SettingsService.getSettings();
    res.json({ settings });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/settings', requirePermission('settings.update'), (req: AuthenticatedRequest, res) => {
  try {
    const updated = SettingsService.updateSettings(req.body, req.user?.id);
    res.json({ settings: updated });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put('/settings/exchange-rate', requirePermission('settings.update'), (req: AuthenticatedRequest, res) => {
  try {
    const { rate } = req.body;
    if (!rate || Number(rate) <= 0) {
      return res.status(400).json({ error: 'Valid exchange rate is required' });
    }
    const updated = SettingsService.updateExchangeRate(Number(rate), req.user?.id);
    res.json({ settings: updated });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
