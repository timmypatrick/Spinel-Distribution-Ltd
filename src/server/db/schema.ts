import crypto from 'crypto';
import { 
  UserProfile, Address, Category, Brand, Product, 
  InventoryItem, InventoryMovement, Cart, CartItem,
  Order, OrderItem, OrderStatusHistoryItem, Payment, 
  Invoice, ImportJob, ImportError, AuditLog, SystemSettings,
  RoleName, PermissionCode, ProductFilterParams, CatalogueStats
} from '../../types';
import { 
  INITIAL_SETTINGS, INITIAL_USERS, INITIAL_CATEGORIES, 
  INITIAL_BRANDS, INITIAL_PRODUCTS 
} from './seedData';

class DatabaseStore {
  public settings: SystemSettings = { ...INITIAL_SETTINGS };
  public users: Map<string, UserProfile & { password_hash: string }> = new Map();
  public addresses: Map<string, Address> = new Map();
  public categories: Map<string, Category> = new Map();
  public brands: Map<string, Brand> = new Map();
  public products: Map<string, Product> = new Map();
  public inventory: Map<string, InventoryItem> = new Map();
  public inventoryMovements: InventoryMovement[] = [];
  public carts: Map<string, Cart> = new Map();
  public orders: Map<string, Order> = new Map();
  public payments: Map<string, Payment> = new Map();
  public invoices: Map<string, Invoice> = new Map();
  public importJobs: Map<string, ImportJob> = new Map();
  public importErrors: ImportError[] = [];
  public auditLogs: AuditLog[] = [];
  public paymentEvents: { id: string; reference: string; eventType: string; payload: unknown; createdAt: string }[] = [];
  public idempotencyKeys: Map<string, { result: unknown; expiresAt: number }> = new Map();

  constructor() {
    this.seed();
  }

  public seed() {
    // Seed users
    for (const u of INITIAL_USERS) {
      this.users.set(u.id, { ...u });
    }

    // Seed default address for customer
    const customerAddr: Address = {
      id: 'addr-customer-01',
      user_id: 'user-customer-01',
      address_type: 'both',
      full_name: 'David Adeleke',
      company: 'Adeleke Logistics & Networks',
      street_line1: 'Plot 14 Victoria Island Industrial Avenue',
      street_line2: 'Suite 402',
      city: 'Lagos',
      state: 'Lagos State',
      postal_code: '101241',
      country: 'Nigeria',
      phone: '+234-803-555-0199',
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.addresses.set(customerAddr.id, customerAddr);

    // Seed categories
    for (const c of INITIAL_CATEGORIES) {
      this.categories.set(c.id, { ...c });
    }

    // Seed brands
    for (const b of INITIAL_BRANDS) {
      this.brands.set(b.id, { ...b });
    }

    // Seed products & inventory
    for (const p of INITIAL_PRODUCTS) {
      this.products.set(p.id, { ...p });
      
      const inv: InventoryItem = {
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        quantity_on_hand: p.stock_quantity,
        quantity_reserved: 0,
        quantity_available: p.stock_quantity,
        reorder_threshold: 10,
        warehouse_location: 'Main Distribution Hub - Zone A',
        last_counted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.inventory.set(p.id, inv);

      this.inventoryMovements.push({
        id: crypto.randomUUID(),
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        movement_type: 'INITIAL',
        quantity_changed: p.stock_quantity,
        previous_quantity: 0,
        new_quantity: p.stock_quantity,
        reference_type: 'initial_stock',
        reason: 'Master catalogue onboarding batch',
        created_by: 'user-admin-01',
        created_at: new Date().toISOString()
      });
    }

    // Seed initial demo order
    const initialOrder: Order = {
      id: 'ord-initial-01',
      order_number: 'SPINEL-2026-0001',
      user_id: 'user-customer-01',
      customer_name: 'David Adeleke',
      customer_email: 'customer@example.com',
      status: 'PAID',
      subtotal_usd: 599.00,
      shipping_usd: 0.00,
      discount_usd: 0.00,
      total_usd: 599.00,
      currency: 'USD',
      exchange_rate: 1500,
      total_charged_ngn: 898500.00,
      shipping_address: customerAddr,
      billing_address: customerAddr,
      tracking_number: 'DHL-EX-992817451',
      carrier: 'DHL Express',
      notes: 'Please verify rack packaging before delivery.',
      items: [
        {
          id: crypto.randomUUID(),
          order_id: 'ord-initial-01',
          product_id: 'prod-ubiquiti-udm-pro',
          sku: 'UBI-UDM-SE',
          product_name: 'Ubiquiti UniFi Dream Machine Special Edition (UDM-SE) 2.5G PoE Gateway',
          image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
          quantity: 1,
          unit_price_usd: 599.00,
          total_price_usd: 599.00
        }
      ],
      status_history: [
        {
          id: crypto.randomUUID(),
          order_id: 'ord-initial-01',
          to_status: 'PENDING_PAYMENT',
          comment: 'Order checkout initiated',
          created_at: '2026-02-15T10:00:00Z'
        },
        {
          id: crypto.randomUUID(),
          order_id: 'ord-initial-01',
          from_status: 'PENDING_PAYMENT',
          to_status: 'PAID',
          comment: 'Paystack payment verified successfully via webhook',
          created_at: '2026-02-15T10:04:12Z'
        }
      ],
      created_at: '2026-02-15T10:00:00Z',
      updated_at: '2026-02-15T10:04:12Z'
    };
    this.orders.set(initialOrder.id, initialOrder);

    // Initial invoice
    const initialInvoice: Invoice = {
      id: 'inv-initial-01',
      invoice_number: 'INV-SPINEL-2026-0001',
      order_id: initialOrder.id,
      order_number: initialOrder.order_number,
      user_id: initialOrder.user_id,
      customer_name: initialOrder.customer_name || 'David Adeleke',
      customer_email: initialOrder.customer_email || 'customer@example.com',
      shipping_address: customerAddr,
      billing_address: customerAddr,
      items: initialOrder.items,
      subtotal_usd: initialOrder.subtotal_usd,
      shipping_usd: initialOrder.shipping_usd,
      discount_usd: initialOrder.discount_usd,
      total_usd: initialOrder.total_usd,
      total_ngn: initialOrder.total_charged_ngn,
      currency: initialOrder.currency,
      exchange_rate: initialOrder.exchange_rate,
      status: 'PAID',
      issued_date: '2026-02-15T10:04:15Z'
    };
    this.invoices.set(initialInvoice.id, initialInvoice);

    // Audit log
    this.auditLogs.push({
      id: crypto.randomUUID(),
      user_id: 'user-admin-01',
      user_email: 'spineldistribution@gmail.com',
      action: 'SYSTEM_BOOTSTRAP',
      entity: 'system',
      entity_id: 'cluster_node_1',
      metadata: { catalogue_version: '2026.1.0', initial_products: INITIAL_PRODUCTS.length },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    });
  }

  // --- CATALOGUE QUERIES & PAGINATION ---
  public queryProducts(params: ProductFilterParams): { products: Product[]; total: number; page: number; limit: number; totalPages: number } {
    let result = Array.from(this.products.values()).filter(p => p.status === 'ACTIVE');

    if (params.category_id) {
      result = result.filter(p => p.category_id === params.category_id);
    } else if (params.category_slug) {
      const cat = Array.from(this.categories.values()).find(c => c.slug === params.category_slug);
      if (cat) {
        result = result.filter(p => p.category_id === cat.id);
      }
    }

    if (params.brand_id) {
      result = result.filter(p => p.brand_id === params.brand_id);
    } else if (params.brand_slug) {
      const b = Array.from(this.brands.values()).find(br => br.slug === params.brand_slug);
      if (b) {
        result = result.filter(p => p.brand_id === b.id);
      }
    }

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(q))
      );
    }

    if (params.min_price !== undefined) {
      result = result.filter(p => p.price_usd >= Number(params.min_price));
    }
    if (params.max_price !== undefined) {
      result = result.filter(p => p.price_usd <= Number(params.max_price));
    }

    if (params.availability) {
      result = result.filter(p => p.availability === params.availability);
    }

    if (params.condition) {
      result = result.filter(p => p.condition === params.condition);
    }

    if (params.min_rating) {
      result = result.filter(p => p.rating >= Number(params.min_rating));
    }

    // Sorting
    const sort = params.sort_by || 'featured';
    if (sort === 'price_asc') {
      result.sort((a, b) => a.price_usd - b.price_usd);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.price_usd - a.price_usd);
    } else if (sort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const total = result.length;
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 24)));
    const totalPages = Math.ceil(total / limit);
    const paginated = result.slice((page - 1) * limit, page * limit);

    return {
      products: paginated,
      total,
      page,
      limit,
      totalPages
    };
  }

  // --- CATALOGUE STATS (DATABASE-LEVEL AGGREGATION) ---
  public getCatalogueStats(): CatalogueStats {
    const productsArr = Array.from(this.products.values());
    const ordersArr = Array.from(this.orders.values());
    const importJobsArr = Array.from(this.importJobs.values());

    let active_products = 0;
    let inactive_products = 0;
    let out_of_stock_products = 0;

    for (const p of productsArr) {
      if (p.status === 'ACTIVE') active_products++;
      else inactive_products++;
      if (p.stock_quantity <= 0 || p.availability === 'OUT_OF_STOCK') out_of_stock_products++;
    }

    let pending_orders = 0;
    let completed_orders = 0;
    let total_revenue_usd = 0;

    for (const o of ordersArr) {
      if (['PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PROCESSING', 'PACKED'].includes(o.status)) {
        pending_orders++;
      }
      if (['COMPLETED', 'DELIVERED'].includes(o.status)) {
        completed_orders++;
      }
      if (['PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(o.status)) {
        total_revenue_usd += o.total_usd;
      }
    }

    const recent_imports = importJobsArr.length;
    const failed_imports = importJobsArr.filter(j => j.status === 'FAILED').length;
    const total_customers = Array.from(this.users.values()).filter(u => u.roles.includes('customer')).length;

    return {
      total_products: productsArr.length,
      active_products,
      inactive_products,
      out_of_stock_products,
      total_categories: this.categories.size,
      total_brands: this.brands.size,
      total_orders: ordersArr.length,
      pending_orders,
      completed_orders,
      total_revenue_usd,
      total_customers,
      recent_imports,
      failed_imports
    };
  }
}

export const db = new DatabaseStore();
