-- ============================================================================
-- SPINEL DISTRIBUTION E-COMMERCE MASTER DATABASE MIGRATION
-- Production-Ready Schema for PostgreSQL / Supabase
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ROLES AND PERMISSIONS (RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================================================
-- 2. USERS AND PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- References auth.users(id) in Supabase
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    address_type VARCHAR(20) DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing', 'both')),
    full_name VARCHAR(150) NOT NULL,
    company VARCHAR(150),
    street_line1 VARCHAR(255) NOT NULL,
    street_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(30) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    phone VARCHAR(30) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CATALOGUE (CATEGORIES, BRANDS, PRODUCTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) UNIQUE NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    logo_url TEXT,
    website VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    subcategory_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    image TEXT NOT NULL,
    price_usd NUMERIC(12, 2) NOT NULL CHECK (price_usd >= 0),
    compare_at_price_usd NUMERIC(12, 2) CHECK (compare_at_price_usd >= price_usd),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    availability VARCHAR(50) DEFAULT 'IN_STOCK' CHECK (availability IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'BACKORDER', 'DISCONTINUED')),
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED')),
    condition VARCHAR(50) DEFAULT 'NEW' CHECK (condition IN ('NEW', 'REFURBISHED', 'OPEN_BOX', 'USED')),
    weight_kg NUMERIC(8, 2),
    dimensions VARCHAR(100), -- e.g. "44 x 4.4 x 45 cm"
    manufacturer VARCHAR(150),
    country_of_origin VARCHAR(100),
    warranty VARCHAR(150),
    specifications JSONB DEFAULT '{}'::jsonb,
    seo_title VARCHAR(255),
    seo_description TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
    review_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    document_url TEXT NOT NULL,
    file_type VARCHAR(20) DEFAULT 'pdf',
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    is_filterable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, attribute_name)
);

-- ============================================================================
-- 4. INVENTORY AND AUDITABLE MOVEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    quantity_on_hand INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    reorder_threshold INT DEFAULT 10,
    warehouse_location VARCHAR(100),
    last_counted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('INITIAL', 'SALE', 'RESERVATION', 'RELEASE', 'RETURN', 'ADJUSTMENT', 'IMPORT')),
    quantity_changed INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_type VARCHAR(50), -- e.g. 'order', 'import_job', 'manual_adjustment'
    reference_id VARCHAR(100),
    reason TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. CARTS AND WISHLISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price_usd NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'My Wishlist',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wishlist_id, product_id)
);

-- ============================================================================
-- 6. ORDERS, PAYMENTS, AND INVOICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN (
        'PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'PAID', 'PROCESSING',
        'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'FAILED'
    )),
    subtotal_usd NUMERIC(12, 2) NOT NULL CHECK (subtotal_usd >= 0),
    shipping_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Free shipping
    discount_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_usd NUMERIC(12, 2) NOT NULL CHECK (total_usd >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    exchange_rate NUMERIC(10, 4) NOT NULL DEFAULT 1500.0000,
    total_charged_ngn NUMERIC(14, 2),
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    notes TEXT,
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_usd NUMERIC(12, 2) NOT NULL CHECK (unit_price_usd >= 0),
    total_price_usd NUMERIC(12, 2) NOT NULL CHECK (total_price_usd >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    comment TEXT,
    changed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'PAYSTACK',
    reference VARCHAR(150) UNIQUE NOT NULL,
    paystack_transaction_id VARCHAR(150),
    amount NUMERIC(14, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL, -- USD or NGN
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'ABANDONED', 'REFUNDED')),
    channel VARCHAR(50),
    gateway_response TEXT,
    ip_address VARCHAR(45),
    idempotency_key VARCHAR(150) UNIQUE,
    metadata JSONB,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    reference VARCHAR(150) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    pdf_url TEXT,
    amount_usd NUMERIC(12, 2) NOT NULL,
    amount_ngn NUMERIC(14, 2),
    status VARCHAR(30) DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'PAID', 'VOID', 'REFUNDED')),
    issued_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. PROMOTIONS AND REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_USD')),
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_usd NUMERIC(10, 2) DEFAULT 0.00,
    max_discount_usd NUMERIC(10, 2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    category_id UUID REFERENCES categories(id),
    percentage NUMERIC(5, 2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    headline VARCHAR(200),
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_votes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. ASYNC IMPORT ENGINE (MILLION-ROW CAPABLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    total_rows INT DEFAULT 0,
    processed_rows INT DEFAULT 0,
    successful_rows INT DEFAULT 0,
    failed_rows INT DEFAULT 0,
    duplicate_rows INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'UPLOADING', 'VALIDATING', 'PROCESSING',
        'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED'
    )),
    created_by UUID REFERENCES profiles(id),
    error_file_path TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    sku VARCHAR(100),
    error_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. AUDIT LOGGING & SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial system settings
INSERT INTO system_settings (key, value, description)
VALUES 
    ('exchange_rate_usd_to_ngn', '{"rate": 1500, "currency": "NGN", "symbol": "₦"}'::jsonb, 'Official exchange rate for USD to NGN conversions'),
    ('free_shipping_enabled', '{"enabled": true, "threshold_usd": 0}'::jsonb, 'All orders qualify for free standard shipping'),
    ('company_details', '{"name": "SPINEL DISTRIBUTION", "email": "spineldistribution@gmail.com", "phone": "+1-800-SPINEL-DIST", "logo": "https://i.ibb.co/nNS90SKj/pokecutweb-1788465862994.png"}'::jsonb, 'Company branding and metadata')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 10. INDEXES FOR MILLION-ROW CATALOGUE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status_avail ON products(status, availability);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_usd);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description || ' ' || sku));

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_prod ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_import_errors_job_id ON import_errors(job_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(requested_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
        AND p.code = requested_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view & update their own profile; admins can view all
CREATE POLICY profiles_user_policy ON profiles
    FOR ALL USING (id = auth.uid() OR public.has_permission('users.read'));

-- Addresses: Users can only see and manipulate their own addresses
CREATE POLICY addresses_user_policy ON addresses
    FOR ALL USING (user_id = auth.uid() OR public.has_permission('customers.read'));

-- Carts: Users can only view & modify their own cart
CREATE POLICY carts_user_policy ON carts
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY cart_items_user_policy ON cart_items
    FOR ALL USING (cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid()));

-- Wishlists: Users can only view & modify their own wishlist
CREATE POLICY wishlists_user_policy ON wishlists
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY wishlist_items_user_policy ON wishlist_items
    FOR ALL USING (wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid()));

-- Orders: Customer can only view their own orders; admin/order_manager can view all
CREATE POLICY orders_customer_select ON orders
    FOR SELECT USING (user_id = auth.uid() OR public.has_permission('orders.read'));

CREATE POLICY orders_customer_insert ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY orders_manager_update ON orders
    FOR UPDATE USING (public.has_permission('orders.update'));

-- Order items: Customer can view their own order items
CREATE POLICY order_items_customer_select ON order_items
    FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()) OR public.has_permission('orders.read'));

-- Invoices: Customer can only view their own invoices; admin can view all
CREATE POLICY invoices_customer_select ON invoices
    FOR SELECT USING (user_id = auth.uid() OR public.has_permission('orders.read'));

-- Notifications: Customer can only view & update their own notifications
CREATE POLICY notifications_customer_policy ON notifications
    FOR ALL USING (user_id = auth.uid());

-- Audit logs: Only administrators can view audit logs
CREATE POLICY audit_logs_admin_select ON audit_logs
    FOR SELECT USING (public.has_permission('settings.read'));

-- Import jobs: Only authorized catalog managers / admins can view and create
CREATE POLICY import_jobs_admin_policy ON import_jobs
    FOR ALL USING (public.has_permission('catalog.import'));

CREATE POLICY import_errors_admin_policy ON import_errors
    FOR ALL USING (public.has_permission('catalog.import'));
