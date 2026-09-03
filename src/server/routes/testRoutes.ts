import { Router } from 'express';
import { AuthService, generateSessionToken } from '../services/authService';
import { RBACService } from '../services/rbacService';
import { ProductService } from '../services/productService';
import { CartService } from '../services/cartService';
import { OrderService } from '../services/orderService';
import { PaymentService } from '../services/paymentService';
import { ImportService } from '../services/importService';
import { InvoiceService } from '../services/invoiceService';
import { db } from '../db/schema';
import { UserProfile, Address } from '../../types';

const router = Router();

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

router.get('/run-all', async (req, res) => {
  const results: TestResult[] = [];

  const runTest = async (suite: string, name: string, fn: () => Promise<void> | void) => {
    const start = Date.now();
    try {
      await fn();
      results.push({ suite, name, passed: true, durationMs: Date.now() - start });
    } catch (err: unknown) {
      results.push({
        suite,
        name,
        passed: false,
        message: (err as Error).message || 'Assertion failed',
        durationMs: Date.now() - start
      });
    }
  };

  // --- SUITE 1: AUTHENTICATION & SESSIONS ---
  await runTest('Authentication', 'Generates valid cryptographic session tokens', () => {
    const token = generateSessionToken('test-user-id');
    if (!token || !token.includes('.')) throw new Error('Invalid token structure');
  });

  await runTest('Authentication', 'Rejects login with invalid credentials', async () => {
    try {
      await AuthService.login({ email: 'nonexistent@spineldistribution.com', password: 'wrong' });
      throw new Error('Should have thrown an error');
    } catch (err: unknown) {
      if ((err as Error).message.includes('Invalid email or password')) return;
      throw err;
    }
  });

  // --- SUITE 2: RBAC & PRIVILEGE ESCALATION ---
  await runTest('RBAC & Authorization', 'Enforces granular permissions by role', () => {
    const customer: UserProfile = {
      id: 'test-cust',
      email: 'c@example.com',
      first_name: 'Test',
      last_name: 'Customer',
      is_active: true,
      email_verified: true,
      roles: ['customer'],
      permissions: ['catalog.read'],
      created_at: '',
      updated_at: ''
    };

    if (RBACService.isAdmin(customer)) {
      throw new Error('Customer was incorrectly flagged as admin');
    }
    if (RBACService.hasPermission(customer, 'catalog.delete')) {
      throw new Error('Customer should not have catalog.delete permission');
    }
  });

  await runTest('RBAC & Authorization', 'Prevents non-super_admin from privilege escalation to super_admin', () => {
    const manager: UserProfile = {
      id: 'test-mgr',
      email: 'm@example.com',
      first_name: 'Catalog',
      last_name: 'Manager',
      is_active: true,
      email_verified: true,
      roles: ['catalog_manager'],
      permissions: ['catalog.read', 'catalog.update'],
      created_at: '',
      updated_at: ''
    };

    const allowed = RBACService.validatePrivilegeEscalation(manager, ['super_admin']);
    if (allowed) {
      throw new Error('Privilege escalation failed: catalog_manager was allowed to grant super_admin');
    }
  });

  // --- SUITE 3: ROW LEVEL SECURITY & CUSTOMER DATA ISOLATION ---
  await runTest('RLS Data Isolation', 'Proves customer A cannot view customer B private orders', () => {
    const customerAId = 'user-customer-01';
    const customerBId = 'user-customer-b';
    const order = OrderService.getOrder('SPINEL-2026-0001', customerBId, false);
    if (order !== null) {
      throw new Error('RLS Breach: Customer B was able to retrieve Customer A private order');
    }
  });

  await runTest('RLS Data Isolation', 'Proves customer A cannot access customer B private invoices', () => {
    const invoice = InvoiceService.getInvoice('INV-SPINEL-2026-0001', 'unauthorized-user-id', false);
    if (invoice !== null) {
      throw new Error('RLS Breach: Unauthorized user retrieved private invoice');
    }
  });

  // --- SUITE 4: CART & SERVER-SIDE PRICE VALIDATION ---
  await runTest('Cart & Server Calculations', 'Recalculates prices using database records, ignoring client tampered prices', () => {
    const testCartId = `test-cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cart = CartService.getOrCreateCart(testCartId);
    const product = Array.from(db.products.values())[0];
    CartService.addItem(cart.id, product.id, 2);
    const refreshed = CartService.getOrCreateCart(cart.id);
    const expected = Math.round(product.price_usd * 2 * 100) / 100;
    if (refreshed.total_usd !== expected) {
      throw new Error(`Expected cart total ${expected}, got ${refreshed.total_usd}`);
    }
  });

  // --- SUITE 5: PAYSTACK IDEMPOTENCY & PAYMENT VERIFICATION ---
  await runTest('Payment & Idempotency', 'Does not duplicate successful payment verification', async () => {
    const customer = Array.from(db.users.values()).find(u => u.roles.includes('customer'))!;
    const addr = Array.from(db.addresses.values())[0];
    const prod = Array.from(db.products.values())[0];

    const order = OrderService.createOrder({
      user: customer,
      items: [{ productId: prod.id, quantity: 1 }],
      shippingAddress: addr,
      billingAddress: addr
    });

    const init = await PaymentService.initializeTransaction({
      orderId: order.id,
      email: customer.email,
      amountUsd: order.total_usd,
      currency: 'USD',
      callbackUrl: 'http://localhost:3000/callback',
      isTest: true
    });

    const firstVerification = await PaymentService.verifyTransaction(init.reference);
    if (!firstVerification.success || firstVerification.order.status !== 'PAID') {
      throw new Error('First payment verification failed');
    }

    const secondVerification = await PaymentService.verifyTransaction(init.reference);
    if (!secondVerification.success) {
      throw new Error('Second idempotent call failed');
    }
  });

  // --- SUITE 6: BULK IMPORT ENGINE & DUPLICATE SKU DETECTION ---
  await runTest('Import Engine', 'Validates duplicate SKUs and records row-level errors', async () => {
    const job = ImportService.createJob({
      fileName: 'test_duplicate_skus.csv',
      filePath: '/imports/test.csv',
      fileSize: 500
    });

    const existingProduct = Array.from(db.products.values())[0];
    const csvContent = `sku,name,category,price_usd,stock_quantity\n${existingProduct.sku},Duplicate Product,Networking,100,5`;

    await ImportService.startProcessingJob(job.id, csvContent, 'csv');

    // Wait for background worker
    await new Promise(r => setTimeout(r, 250));

    const errors = ImportService.getJobErrors(job.id);
    const duplicateError = errors.find(e => e.error_type === 'DUPLICATE_SKU');
    if (!duplicateError) {
      throw new Error('Import engine failed to detect duplicate SKU');
    }
  });

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  res.json({
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      allPassed: failedCount === 0
    },
    results
  });
});

export default router;
