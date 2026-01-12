-- ========================================
-- WONDER TEAM DATABASE SCHEMA
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. PRODUCTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    price_purchase DECIMAL(10, 2),
    price_public DECIMAL(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    stock_alert_threshold INTEGER DEFAULT 5,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. CLIENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    birth_date DATE,
    notes TEXT,
    loyalty_points INTEGER DEFAULT 0,
    preferred_contact VARCHAR(50),
    last_purchase_date DATE,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    subtotal DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. ORDER ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    payment_method VARCHAR(50),
    reference_id VARCHAR(100),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_orders_client ON public.orders(client_id);
CREATE INDEX idx_orders_date ON public.orders(order_date);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users to read all data
CREATE POLICY "Allow authenticated users to read products"
    ON public.products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read clients"
    ON public.clients FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read order_items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (true);

-- Policies: Allow authenticated users to insert/update data
CREATE POLICY "Allow authenticated users to insert products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
    ON public.products FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert clients"
    ON public.clients FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update clients"
    ON public.clients FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert order_items"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ========================================
-- SAMPLE DATA (OPTIONAL)
-- ========================================
INSERT INTO public.products (name, brand, category, price_purchase, price_public, stock_quantity, sku) VALUES
    ('Crème Hydratante', 'Luxe Beauty', 'Soins du visage', 25.00, 45.00, 50, 'LB-001'),
    ('Sérum Anti-Âge', 'Luxe Beauty', 'Soins du visage', 40.00, 75.00, 30, 'LB-002'),
    ('Parfum Élégance', 'Prestige Parfums', 'Parfums', 60.00, 120.00, 25, 'PP-001')
ON CONFLICT (sku) DO NOTHING;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Wonder Team database schema initialized successfully!';
END $$;
