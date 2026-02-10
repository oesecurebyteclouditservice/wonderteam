-- ========================================
-- WONDER TEAM DATABASE SCHEMA
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. PROFILES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'vdi',
    avatar_url TEXT,
    team_name VARCHAR(255),
    sponsor VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. PRODUCTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    reference VARCHAR(100),
    price_public DECIMAL(10, 2),
    price_cost DECIMAL(10, 2),
    stock_quantity INTEGER DEFAULT 0,
    alert_threshold INTEGER DEFAULT 5,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. CLIENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    status VARCHAR(50) DEFAULT 'new',
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
-- 4. ORDERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    profit DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    items JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 5. ORDER ITEMS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 6. TRANSACTIONS TABLE
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
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON public.products(stock_quantity, alert_threshold);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);

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

-- Attach trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: order_items and transactions do not have updated_at columns by design
-- (order_items are immutable records, transactions are append-only)

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- PROFILES: Users can read/update own profile
-- ----------------------------------------
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ----------------------------------------
-- PRODUCTS: Anon can browse, authenticated can manage
-- ----------------------------------------
CREATE POLICY "Allow anon to browse products"
    ON public.products FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow authenticated users to read products"
    ON public.products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
    ON public.products FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to delete products"
    ON public.products FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------
-- CLIENTS: Authenticated users can manage
-- ----------------------------------------
CREATE POLICY "Allow authenticated users to read clients"
    ON public.clients FOR SELECT
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

CREATE POLICY "Allow authenticated users to delete clients"
    ON public.clients FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------
-- ORDERS: Authenticated users can manage
-- ----------------------------------------
CREATE POLICY "Allow authenticated users to read orders"
    ON public.orders FOR SELECT
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

CREATE POLICY "Allow authenticated users to delete orders"
    ON public.orders FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------
-- ORDER ITEMS: Authenticated users can manage
-- ----------------------------------------
CREATE POLICY "Allow authenticated users to read order_items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert order_items"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update order_items"
    ON public.order_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to delete order_items"
    ON public.order_items FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------
-- TRANSACTIONS: Authenticated users can manage
-- ----------------------------------------
CREATE POLICY "Allow authenticated users to read transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update transactions"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to delete transactions"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (true);

-- ========================================
-- RPC FUNCTIONS
-- ========================================

-- ----------------------------------------
-- get_dashboard_stats: Aggregated dashboard statistics
-- Returns total revenue, total profit, client count, product count, low stock count
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_revenue', COALESCE((SELECT SUM(total_amount) FROM public.orders), 0),
        'total_profit', COALESCE((SELECT SUM(profit) FROM public.orders), 0),
        'total_clients', (SELECT COUNT(*) FROM public.clients WHERE is_active = true),
        'total_products', (SELECT COUNT(*) FROM public.products WHERE is_active = true),
        'low_stock_count', (SELECT COUNT(*) FROM public.products WHERE is_active = true AND stock_quantity <= alert_threshold),
        'total_orders', (SELECT COUNT(*) FROM public.orders),
        'total_stock_value', COALESCE((SELECT SUM(stock_quantity * price_public) FROM public.products WHERE is_active = true), 0)
    ) INTO result;

    RETURN result;
END;
$$;

-- ----------------------------------------
-- get_low_stock_products: Products at or below stock threshold
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.get_low_stock_products(threshold INT DEFAULT 5)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.products
    WHERE is_active = true
      AND stock_quantity <= threshold
    ORDER BY stock_quantity ASC, name ASC;
END;
$$;

-- ----------------------------------------
-- update_stock_quantity: Atomically adjust stock by a delta
-- p_id: product UUID
-- qty_change: positive to add stock, negative to remove
-- Returns the new stock_quantity
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.update_stock_quantity(p_id UUID, qty_change INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_qty INT;
BEGIN
    UPDATE public.products
    SET stock_quantity = GREATEST(0, stock_quantity + qty_change)
    WHERE id = p_id
    RETURNING stock_quantity INTO new_qty;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with id % not found', p_id;
    END IF;

    RETURN new_qty;
END;
$$;

-- ----------------------------------------
-- create_order_with_items: Atomic order creation
-- Creates order, inserts order_items, updates product stock, creates transaction
-- All in a single database transaction
--
-- Parameters:
--   p_client_id: UUID of the client
--   p_items: JSONB array of items, each with: product_id, product_name, quantity, unit_price, subtotal
--   p_total_amount: total order amount
--   p_profit: calculated profit
--   p_status: order status (default 'pending')
--   p_payment_status: payment status (default 'pending')
--   p_payment_method: payment method for transaction record
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_client_id UUID,
    p_items JSONB,
    p_total_amount DECIMAL(10,2),
    p_profit DECIMAL(10,2) DEFAULT 0,
    p_status VARCHAR DEFAULT 'pending',
    p_payment_status VARCHAR DEFAULT 'pending',
    p_payment_method VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INT;
    v_current_stock INT;
BEGIN
    -- 1. Create the order
    INSERT INTO public.orders (client_id, total_amount, profit, status, payment_status, items)
    VALUES (p_client_id, p_total_amount, p_profit, p_status, p_payment_status, p_items)
    RETURNING id INTO v_order_id;

    -- 2. Insert order items and update stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item ->> 'product_id')::UUID;
        v_quantity := (v_item ->> 'quantity')::INT;

        -- Insert order item
        INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES (
            v_order_id,
            v_product_id,
            v_item ->> 'product_name',
            v_quantity,
            (v_item ->> 'unit_price')::DECIMAL(10,2),
            (v_item ->> 'subtotal')::DECIMAL(10,2)
        );

        -- Verify stock availability and update
        SELECT stock_quantity INTO v_current_stock
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Product % not found', v_product_id;
        END IF;

        IF v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %: available %, requested %',
                v_product_id, v_current_stock, v_quantity;
        END IF;

        UPDATE public.products
        SET stock_quantity = stock_quantity - v_quantity
        WHERE id = v_product_id;
    END LOOP;

    -- 3. Create transaction record
    INSERT INTO public.transactions (
        transaction_type, amount, description, category,
        payment_method, order_id, created_by
    )
    VALUES (
        'sale',
        p_total_amount,
        'Commande ' || v_order_id::TEXT,
        'order',
        p_payment_method,
        v_order_id,
        auth.uid()
    );

    -- 4. Update client total_spent and last_purchase_date if client is specified
    IF p_client_id IS NOT NULL THEN
        UPDATE public.clients
        SET total_spent = total_spent + p_total_amount,
            last_purchase_date = CURRENT_DATE
        WHERE id = p_client_id;
    END IF;

    RETURN v_order_id;
END;
$$;

-- ========================================
-- SAMPLE DATA
-- ========================================
INSERT INTO public.products (name, brand, category, reference, price_cost, price_public, stock_quantity, alert_threshold, sku) VALUES
    ('ACQUA DI SALE', 'PROFUMUM ROMA', 'HOMME', '069', 34.50, 69.00, 5, 2, 'PR-069'),
    ('LA VIE EST BELLE', 'LANCOME', 'FEMME', '042', 42.00, 85.00, 12, 3, 'LC-042'),
    ('OMBRE LEATHER', 'TOM FORD', 'MIXTES LUXES', '142', 71.00, 142.00, 2, 2, 'TF-142'),
    ('CRYSTAL NOIR', 'VERSACE', 'FEMME', '047', 23.50, 47.00, 8, 2, 'VS-047'),
    ('MEGAMARE', 'ORTO PARISI', 'LUXURY MIXTES', '130', 65.00, 130.00, 0, 2, 'OP-130'),
    ('GOOD GIRL GONE BAD', 'KILLIAN', 'LUXURY FEMME', '123', 61.50, 123.00, 4, 2, 'KL-123')
ON CONFLICT (sku) DO NOTHING;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- ========================================
-- SESSION 4 ADDITIONS (2026-02-10)
-- ========================================

-- Add recruits JSONB column to profiles
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN recruits JSONB DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add payment_link_id to orders
DO $$ BEGIN
    ALTER TABLE public.orders ADD COLUMN payment_link_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Auto-decrement stock when order is created via direct INSERT (backup for create_order_with_items)
CREATE OR REPLACE FUNCTION auto_decrement_stock()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF NEW.items IS NOT NULL THEN
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            UPDATE public.products
            SET stock_quantity = GREATEST(0, stock_quantity - (item.value->>'quantity')::int)
            WHERE id = (item.value->>'id')::uuid;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrement_stock ON public.orders;
CREATE TRIGGER trigger_decrement_stock
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION auto_decrement_stock();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'), 'vdi')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger goes on auth.users - must be run with service_role/superuser access
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE 'Wonder Team database schema initialized successfully!';
END $$;
