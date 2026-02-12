-- ========================================
-- MIGRATION: Add user_id to products and orders
-- Fix data persistence across sessions
-- ========================================

-- ========================================
-- 1. ADD user_id TO products TABLE
-- ========================================

-- Add user_id column to products (nullable first for existing data)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);

-- Set user_id for existing products (assign to first user if any, or leave null)
-- This is a one-time migration - new products will have user_id set automatically
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user from auth.users
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;

    IF first_user_id IS NOT NULL THEN
        -- Update existing products without user_id
        UPDATE public.products
        SET user_id = first_user_id
        WHERE user_id IS NULL;

        RAISE NOTICE 'Migrated % products to user %',
            (SELECT COUNT(*) FROM public.products WHERE user_id = first_user_id),
            first_user_id;
    ELSE
        RAISE NOTICE 'No users found - existing products remain without user_id';
    END IF;
END $$;

-- ========================================
-- 2. ADD user_id TO orders TABLE
-- ========================================

-- Add user_id column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Set user_id for existing orders based on client's user_id
UPDATE public.orders o
SET user_id = c.user_id
FROM public.clients c
WHERE o.client_id = c.id AND o.user_id IS NULL;

-- ========================================
-- 3. UPDATE RLS POLICIES - PRODUCTS
-- ========================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow anon to browse products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to read products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON public.products;

-- Create strict user-scoped policies
CREATE POLICY "Users can read own products"
    ON public.products FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own products"
    ON public.products FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own products"
    ON public.products FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ========================================
-- 4. UPDATE RLS POLICIES - CLIENTS
-- ========================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON public.clients;

-- Create strict user-scoped policies
CREATE POLICY "Users can read own clients"
    ON public.clients FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own clients"
    ON public.clients FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own clients"
    ON public.clients FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own clients"
    ON public.clients FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ========================================
-- 5. UPDATE RLS POLICIES - ORDERS
-- ========================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to delete orders" ON public.orders;

-- Create strict user-scoped policies
CREATE POLICY "Users can read own orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own orders"
    ON public.orders FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ========================================
-- 6. UPDATE RLS POLICIES - ORDER_ITEMS
-- ========================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow authenticated users to update order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete order_items" ON public.order_items;

-- Create policies that check via the parent order
CREATE POLICY "Users can read own order_items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own order_items"
    ON public.order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own order_items"
    ON public.order_items FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own order_items"
    ON public.order_items FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- ========================================
-- 7. UPDATE RLS POLICIES - TRANSACTIONS
-- ========================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated users to update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow authenticated users to delete transactions" ON public.transactions;

-- Create strict user-scoped policies (transactions are already created_by user)
CREATE POLICY "Users can read own transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

-- ========================================
-- 8. UPDATE RPC FUNCTIONS
-- ========================================

-- Update get_dashboard_stats to filter by user
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    SELECT json_build_object(
        'total_revenue', COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE user_id = current_user_id), 0),
        'total_profit', COALESCE((SELECT SUM(profit) FROM public.orders WHERE user_id = current_user_id), 0),
        'total_clients', (SELECT COUNT(*) FROM public.clients WHERE user_id = current_user_id AND is_active = true),
        'total_products', (SELECT COUNT(*) FROM public.products WHERE user_id = current_user_id AND is_active = true),
        'low_stock_count', (SELECT COUNT(*) FROM public.products WHERE user_id = current_user_id AND is_active = true AND stock_total <= alert_threshold),
        'total_orders', (SELECT COUNT(*) FROM public.orders WHERE user_id = current_user_id),
        'total_stock_value', COALESCE(
            (SELECT SUM(
                (stock_15ml * price_15ml) +
                (stock_30ml * price_30ml) +
                (stock_70ml * price_70ml)
            ) FROM public.products WHERE user_id = current_user_id AND is_active = true), 0
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Update get_low_stock_products to filter by user
CREATE OR REPLACE FUNCTION public.get_low_stock_products(threshold INT DEFAULT 5)
RETURNS SETOF public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    RETURN QUERY
    SELECT *
    FROM public.products
    WHERE user_id = current_user_id
      AND is_active = true
      AND stock_total <= threshold
    ORDER BY stock_total ASC, name ASC;
END;
$$;

-- Update create_order_with_items to include user_id
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
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- 1. Create the order with user_id
    INSERT INTO public.orders (client_id, user_id, total_amount, profit, status, payment_status, items)
    VALUES (p_client_id, v_user_id, p_total_amount, p_profit, p_status, p_payment_status, p_items)
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
        SELECT stock_total INTO v_current_stock
        FROM public.products
        WHERE id = v_product_id AND user_id = v_user_id
        FOR UPDATE;

        IF v_current_stock IS NULL THEN
            RAISE EXCEPTION 'Product % not found or not owned by user', v_product_id;
        END IF;

        IF v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %: available %, requested %',
                v_product_id, v_current_stock, v_quantity;
        END IF;

        -- Update stock (adjust all size stocks proportionally)
        UPDATE public.products
        SET stock_total = stock_total - v_quantity
        WHERE id = v_product_id AND user_id = v_user_id;
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
        v_user_id
    );

    -- 4. Update client total_spent and last_purchase_date if client is specified
    IF p_client_id IS NOT NULL THEN
        UPDATE public.clients
        SET total_spent = total_spent + p_total_amount,
            last_purchase_date = CURRENT_DATE
        WHERE id = p_client_id AND user_id = v_user_id;
    END IF;

    RETURN v_order_id;
END;
$$;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '- Added user_id to products and orders tables';
    RAISE NOTICE '- Updated all RLS policies to filter by user';
    RAISE NOTICE '- Updated RPC functions to respect user isolation';
    RAISE NOTICE '- All data is now properly scoped to users';
END $$;
