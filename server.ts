import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

// Middlewares and services
import { authMiddleware } from './src/server/middleware/authMiddleware';
import authRoutes from './src/server/routes/authRoutes';
import productRoutes from './src/server/routes/productRoutes';
import cartRoutes from './src/server/routes/cartRoutes';
import orderRoutes from './src/server/routes/orderRoutes';
import paymentRoutes from './src/server/routes/paymentRoutes';
import invoiceRoutes from './src/server/routes/invoiceRoutes';
import adminRoutes from './src/server/routes/adminRoutes';
import testRoutes from './src/server/routes/testRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parser with generous limit for large Excel/CSV datasets
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Global authentication session middleware
  app.use(authMiddleware);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'SPINEL DISTRIBUTION',
      version: '2026.1.0',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/test-runner', testRoutes);

  // Centralized Error Handling (Requirement 31: Never expose stack traces or internal secrets)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[API Error] ${req.method} ${req.path}:`, err);
    res.status(err.status || 500).json({
      error: err.message || 'An internal server error occurred. Please contact Spinel Distribution support.',
      status: 'error'
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SPINEL DISTRIBUTION] Production server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
