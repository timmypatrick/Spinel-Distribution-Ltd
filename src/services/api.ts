import { 
  Product, Category, Brand, Cart, Order, Invoice, 
  ImportJob, ImportError, UserProfile, SystemSettings, 
  CatalogueStats, ProductFilterParams, InventoryItem, 
  InventoryMovement, AuditLog, RoleName 
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('spinel_auth_token');
  const cartId = localStorage.getItem('spinel_cart_id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (cartId) {
    headers['x-cart-id'] = cartId;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async register(params: { email: string; password: string; first_name: string; last_name: string; phone?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return handleResponse<{ user: UserProfile; token: string }>(res);
  },

  async login(params: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return handleResponse<{ user: UserProfile; token: string }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
    return handleResponse<{ user: UserProfile }>(res);
  },

  async updateProfile(data: Partial<UserProfile>) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ user: UserProfile }>(res);
  },

  async getAddresses() {
    const res = await fetch(`${API_BASE}/auth/addresses`, { headers: getAuthHeaders() });
    return handleResponse<{ addresses: any[] }>(res);
  },

  async addAddress(address: any) {
    const res = await fetch(`${API_BASE}/auth/addresses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(address)
    });
    return handleResponse<{ address: any }>(res);
  },

  // Products
  async getProducts(params: ProductFilterParams = {}) {
    const query = new URLSearchParams();
    if (params.category_id) query.set('category_id', params.category_id);
    if (params.category_slug) query.set('category_slug', params.category_slug);
    if (params.brand_id) query.set('brand_id', params.brand_id);
    if (params.brand_slug) query.set('brand_slug', params.brand_slug);
    if (params.search) query.set('search', params.search);
    if (params.min_price) query.set('min_price', String(params.min_price));
    if (params.max_price) query.set('max_price', String(params.max_price));
    if (params.availability) query.set('availability', params.availability);
    if (params.condition) query.set('condition', params.condition);
    if (params.min_rating) query.set('min_rating', String(params.min_rating));
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    return handleResponse<{ products: Product[]; page: number; limit: number; hasMore: boolean }>(res);
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/products/categories`);
    return handleResponse<{ categories: Category[] }>(res);
  },

  async getBrands() {
    const res = await fetch(`${API_BASE}/products/brands`);
    return handleResponse<{ brands: Brand[] }>(res);
  },

  async getProduct(slugOrId: string) {
    const res = await fetch(`${API_BASE}/products/${slugOrId}`);
    return handleResponse<{ product: Product }>(res);
  },

  // Cart
  async getCart(cartId?: string) {
    const id = cartId || localStorage.getItem('spinel_cart_id') || '';
    const res = await fetch(`${API_BASE}/cart?cart_id=${id}`, { headers: getAuthHeaders() });
    return handleResponse<{ cart: Cart }>(res);
  },

  async addToCart(productId: string, quantity: number = 1) {
    const cartId = localStorage.getItem('spinel_cart_id') || '';
    const res = await fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cart_id: cartId, product_id: productId, quantity })
    });
    return handleResponse<{ cart: Cart }>(res);
  },

  async updateCartQuantity(productId: string, quantity: number) {
    const cartId = localStorage.getItem('spinel_cart_id') || '';
    const res = await fetch(`${API_BASE}/cart/update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cart_id: cartId, product_id: productId, quantity })
    });
    return handleResponse<{ cart: Cart }>(res);
  },

  async removeFromCart(productId: string) {
    const cartId = localStorage.getItem('spinel_cart_id') || '';
    const res = await fetch(`${API_BASE}/cart/remove`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cart_id: cartId, product_id: productId })
    });
    return handleResponse<{ cart: Cart }>(res);
  },

  async clearCart() {
    const cartId = localStorage.getItem('spinel_cart_id') || '';
    const res = await fetch(`${API_BASE}/cart/clear`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cart_id: cartId })
    });
    return handleResponse<{ cart: Cart }>(res);
  },

  // Orders
  async checkout(params: {
    items: { productId: string; quantity: number }[];
    shipping_address: any;
    billing_address?: any;
    currency?: 'USD' | 'NGN';
    notes?: string;
    idempotency_key?: string;
  }) {
    const res = await fetch(`${API_BASE}/orders/checkout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse<{ order: Order }>(res);
  },

  async getUserOrders() {
    const res = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
    return handleResponse<{ orders: Order[] }>(res);
  },

  async getOrder(orderId: string) {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, { headers: getAuthHeaders() });
    return handleResponse<{ order: Order }>(res);
  },

  async trackOrder(orderId: string) {
    const res = await fetch(`${API_BASE}/orders/${orderId}/track`);
    return handleResponse<any>(res);
  },

  // Paystack
  async initializePayment(orderId: string, currency: 'USD' | 'NGN') {
    const res = await fetch(`${API_BASE}/payments/initialize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ order_id: orderId, currency })
    });
    return handleResponse<{
      authorization_url: string;
      access_code: string;
      reference: string;
      amount: number;
      currency: string;
    }>(res);
  },

  async verifyPayment(reference: string) {
    const res = await fetch(`${API_BASE}/payments/verify/${reference}`);
    return handleResponse<{ success: boolean; payment: any; order: Order }>(res);
  },

  // Invoices
  async getUserInvoices() {
    const res = await fetch(`${API_BASE}/invoices`, { headers: getAuthHeaders() });
    return handleResponse<{ invoices: Invoice[] }>(res);
  },

  async getInvoice(id: string) {
    const res = await fetch(`${API_BASE}/invoices/${id}`, { headers: getAuthHeaders() });
    return handleResponse<{ invoice: Invoice }>(res);
  },

  // Settings
  async getSettings() {
    const res = await fetch(`${API_BASE}/admin/settings`);
    return handleResponse<{ settings: SystemSettings }>(res);
  },

  // Admin
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, { headers: getAuthHeaders() });
    return handleResponse<{ stats: CatalogueStats }>(res);
  },

  // Alias for getAdminStats
  async getDashboardStats() {
    return this.getAdminStats();
  },

  async getAdminProducts(paramsOrPage: ProductFilterParams | number = {}, limit?: number, search?: string, category_id?: string) {
    const params: ProductFilterParams = typeof paramsOrPage === 'number'
      ? { page: paramsOrPage, limit, search, category_id }
      : paramsOrPage;

    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category_id) query.set('category_id', params.category_id);
    if (params.brand_id) query.set('brand_id', params.brand_id);
    if (params.availability) query.set('availability', params.availability);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/admin/products?${query.toString()}`, { headers: getAuthHeaders() });
    return handleResponse<{ products: Product[]; total: number; page: number; limit: number; totalPages: number }>(res);
  },

  async createProduct(productData: any) {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse<{ product: Product }>(res);
  },

  async updateProduct(id: string, productData: any) {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse<{ product: Product }>(res);
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async getAdminInventory() {
    const res = await fetch(`${API_BASE}/admin/inventory`, { headers: getAuthHeaders() });
    return handleResponse<{ inventory: InventoryItem[]; movements: InventoryMovement[] }>(res);
  },

  async getInventoryMovements(limit?: number) {
    const inv = await this.getAdminInventory();
    return { movements: inv.movements };
  },

  async adjustInventory(productIdOrParams: string | { product_id: string; quantity_change?: number; new_quantity?: number; reason?: string; notes?: string }, newQuantity?: number, reason?: string) {
    let payload: { product_id: string; new_quantity: number; reason: string };
    if (typeof productIdOrParams === 'object') {
      const q = productIdOrParams.new_quantity !== undefined 
        ? productIdOrParams.new_quantity 
        : (productIdOrParams.quantity_change || 0);
      payload = {
        product_id: productIdOrParams.product_id,
        new_quantity: q,
        reason: productIdOrParams.reason || productIdOrParams.notes || 'Admin adjustment'
      };
    } else {
      payload = {
        product_id: productIdOrParams,
        new_quantity: newQuantity || 0,
        reason: reason || 'Admin adjustment'
      };
    }

    const res = await fetch(`${API_BASE}/admin/inventory/adjust`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse<{ inventory: InventoryItem }>(res);
  },

  async getAdminOrders() {
    const res = await fetch(`${API_BASE}/admin/orders`, { headers: getAuthHeaders() });
    return handleResponse<{ orders: Order[] }>(res);
  },

  async updateOrderStatus(orderId: string, statusOrParams: string | { status: string; carrier?: string; tracking_number?: string; comment?: string }, commentParam?: string) {
    let payload: { status: string; comment: string };
    if (typeof statusOrParams === 'object') {
      const details = [
        statusOrParams.comment,
        statusOrParams.carrier ? `Carrier: ${statusOrParams.carrier}` : '',
        statusOrParams.tracking_number ? `Tracking: ${statusOrParams.tracking_number}` : ''
      ].filter(Boolean).join(' | ');
      payload = {
        status: statusOrParams.status,
        comment: details || `Status changed to ${statusOrParams.status}`
      };
    } else {
      payload = {
        status: statusOrParams,
        comment: commentParam || `Status changed to ${statusOrParams}`
      };
    }

    const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse<{ order: Order }>(res);
  },

  // Imports
  async getImportJobs() {
    const res = await fetch(`${API_BASE}/admin/imports`, { headers: getAuthHeaders() });
    return handleResponse<{ jobs: ImportJob[] }>(res);
  },

  async getImportJob(jobId: string) {
    return this.getImportJobDetails(jobId);
  },

  async createImportJob(fileName: string, fileSize: number) {
    const res = await fetch(`${API_BASE}/admin/imports/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ file_name: fileName, file_size: fileSize })
    });
    return handleResponse<{ job: ImportJob }>(res);
  },

  async startImportJob(jobId: string, rawContent: string, fileType: 'csv' | 'xlsx') {
    const res = await fetch(`${API_BASE}/admin/imports/${jobId}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ raw_content: rawContent, file_type: fileType })
    });
    return handleResponse<{ job: ImportJob }>(res);
  },

  async uploadCatalogue(fileOrContent: string, contentOrType?: string, optionalName?: string) {
    let fileName = 'catalogue_import.csv';
    let fileType: 'csv' | 'xlsx' = 'csv';
    let rawContent = '';

    if (contentOrType && (contentOrType.includes('\n') || contentOrType.includes(','))) {
      // Called as uploadCatalogue(fileName, fileContent)
      fileName = fileOrContent;
      rawContent = contentOrType;
      fileType = fileName.endsWith('.xlsx') ? 'xlsx' : 'csv';
    } else {
      // Called as uploadCatalogue(fileContent, fileType, fileName)
      rawContent = fileOrContent;
      fileType = (contentOrType === 'xlsx' ? 'xlsx' : 'csv');
      fileName = optionalName || `catalogue_import.${fileType}`;
    }

    const createRes = await this.createImportJob(fileName, rawContent.length);
    const startRes = await this.startImportJob(createRes.job.id, rawContent, fileType);
    return startRes;
  },

  async getImportJobDetails(jobId: string) {
    const res = await fetch(`${API_BASE}/admin/imports/${jobId}`, { headers: getAuthHeaders() });
    return handleResponse<{ job: ImportJob; errors: ImportError[] }>(res);
  },

  async cancelImportJob(jobId: string) {
    const res = await fetch(`${API_BASE}/admin/imports/${jobId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{ job: ImportJob }>(res);
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getAuthHeaders() });
    return handleResponse<{ users: UserProfile[] }>(res);
  },

  async updateUserRoles(userId: string, roles: RoleName[]) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/roles`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ roles })
    });
    return handleResponse<{ user: UserProfile }>(res);
  },

  async updateUserRole(userId: string, role: RoleName) {
    return this.updateUserRoles(userId, [role]);
  },

  async getAuditLogs(limitOrAction: number | string = 100) {
    const limit = typeof limitOrAction === 'number' ? limitOrAction : 100;
    const res = await fetch(`${API_BASE}/admin/audit-logs?limit=${limit}`, { headers: getAuthHeaders() });
    return handleResponse<{ logs: AuditLog[] }>(res);
  },

  async updateExchangeRate(rate: number) {
    const res = await fetch(`${API_BASE}/admin/settings/exchange-rate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rate })
    });
    return handleResponse<{ settings: SystemSettings }>(res);
  },

  async updateSystemSettings(partial: Partial<SystemSettings>) {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(partial)
    });
    return handleResponse<{ settings: SystemSettings }>(res);
  },

  async updateSettings(partial: Partial<SystemSettings>) {
    return this.updateSystemSettings(partial);
  },

  // Test Runner
  async runAllTests() {
    const res = await fetch(`${API_BASE}/test-runner/run-all`);
    return handleResponse<{
      summary: { total: number; passed: number; failed: number; allPassed: boolean };
      results: { suite: string; name: string; passed: boolean; message?: string; durationMs: number }[];
    }>(res);
  }
};
