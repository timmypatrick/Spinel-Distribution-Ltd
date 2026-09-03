export type RoleName = 
  | 'customer' 
  | 'admin' 
  | 'super_admin' 
  | 'catalog_manager' 
  | 'order_manager'
  | 'inventory_manager'
  | 'customer_support';

export type Role = RoleName;
export type User = UserProfile;

export type PermissionCode = 
  | 'catalog.read'
  | 'catalog.create'
  | 'catalog.update'
  | 'catalog.delete'
  | 'catalog.import'
  | 'orders.read'
  | 'orders.update'
  | 'customers.read'
  | 'customers.update'
  | 'users.read'
  | 'users.update'
  | 'imports.create'
  | 'imports.cancel'
  | 'settings.read'
  | 'settings.update';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  roles: RoleName[];
  permissions: PermissionCode[];
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  address_type: 'shipping' | 'billing' | 'both';
  full_name: string;
  company?: string;
  street_line1: string;
  street_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  description?: string;
  is_active: boolean;
}

export interface ProductSpecification {
  [key: string]: string | number | boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category_id: string;
  category_name?: string;
  subcategory_id?: string;
  brand_id?: string;
  brand_name?: string;
  description: string;
  short_description?: string;
  image: string;
  additional_images?: string[];
  price_usd: number;
  compare_at_price_usd?: number;
  stock_quantity: number;
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACKORDER' | 'DISCONTINUED';
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  condition: 'NEW' | 'REFURBISHED' | 'OPEN_BOX' | 'USED';
  weight_kg?: number;
  dimensions?: string;
  manufacturer?: string;
  country_of_origin?: string;
  warranty?: string;
  specifications: ProductSpecification;
  seo_title?: string;
  seo_description?: string;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  reorder_threshold: number;
  warehouse_location: string;
  last_counted_at?: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  movement_type: 'INITIAL' | 'SALE' | 'RESERVATION' | 'RELEASE' | 'RETURN' | 'ADJUSTMENT' | 'IMPORT';
  quantity_changed: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  product: Product;
  quantity: number;
  unit_price_usd: number;
  total_price_usd: number;
}

export interface Cart {
  id: string;
  user_id?: string;
  items: CartItem[];
  subtotal_usd: number;
  shipping_usd: number;
  discount_usd: number;
  total_usd: number;
  total_items: number;
}

export type OrderStatus = 
  | 'PENDING_PAYMENT'
  | 'PAYMENT_PROCESSING'
  | 'PAID'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  sku: string;
  product_name: string;
  image: string;
  quantity: number;
  unit_price_usd: number;
  total_price_usd: number;
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  from_status?: OrderStatus;
  to_status: OrderStatus;
  comment?: string;
  changed_by?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name?: string;
  customer_email?: string;
  status: OrderStatus;
  subtotal_usd: number;
  shipping_usd: number;
  discount_usd: number;
  total_usd: number;
  currency: 'USD' | 'NGN';
  exchange_rate: number;
  total_charged_ngn?: number;
  shipping_address: Address;
  billing_address: Address;
  tracking_number?: string;
  carrier?: string;
  notes?: string;
  items: OrderItem[];
  status_history: OrderStatusHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  order_number?: string;
  provider: 'PAYSTACK';
  reference: string;
  paystack_transaction_id?: string;
  amount: number;
  currency: 'USD' | 'NGN';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ABANDONED' | 'REFUNDED';
  channel?: string;
  gateway_response?: string;
  ip_address?: string;
  idempotency_key?: string;
  paid_at?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: Address;
  billing_address: Address;
  items: OrderItem[];
  subtotal_usd: number;
  shipping_usd: number;
  discount_usd: number;
  total_usd: number;
  total_ngn?: number;
  currency: 'USD' | 'NGN';
  exchange_rate: number;
  status: 'ISSUED' | 'PAID' | 'VOID' | 'REFUNDED';
  issued_date: string;
  pdf_url?: string;
}

export type ImportStatus = 
  | 'PENDING'
  | 'UPLOADING'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ImportJob {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  duplicate_rows: number;
  status: ImportStatus;
  created_by?: string;
  error_file_path?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportError {
  id: string;
  job_id: string;
  row_number: number;
  sku?: string;
  error_type: string;
  message: string;
  raw_data?: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface SystemSettings {
  exchange_rate_usd_to_ngn: number;
  free_shipping_enabled: boolean;
  free_shipping_threshold_usd: number;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_logo: string;
  order_prefix?: string;
  support_email?: string;
  support_phone?: string;
}

export interface CatalogueStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  out_of_stock_products: number;
  total_categories: number;
  total_brands: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue_usd: number;
  total_customers: number;
  recent_imports: number;
  failed_imports: number;
}

export interface ProductFilterParams {
  category_id?: string;
  category_slug?: string;
  brand_id?: string;
  brand_slug?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  availability?: string;
  condition?: string;
  min_rating?: number;
  sort_by?: 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
  cursor?: string;
}
