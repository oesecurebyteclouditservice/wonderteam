-- ========================================
-- MIGRATION: Update Products Table Structure
-- To match MonStock_all.csv format
-- ========================================

-- Drop existing products table and recreate with new structure
DROP TABLE IF EXISTS public.products CASCADE;

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,                    -- NOM
    brand VARCHAR(255),                            -- MARQUE
    category VARCHAR(100),                         -- CATEGORIE

    -- Reference codes for different sizes
    cat_15ml VARCHAR(100),                         -- CAT_15ML
    cat_30ml VARCHAR(100),                         -- CAT_30ML
    cat_70ml VARCHAR(100),                         -- CAT_70ML

    -- Prices for different sizes
    price_15ml DECIMAL(10, 2) DEFAULT 0,          -- PX_15ML
    price_30ml DECIMAL(10, 2) DEFAULT 0,          -- PX_30ML
    price_70ml DECIMAL(10, 2) DEFAULT 0,          -- PX_70ML

    -- Stock quantities
    stock_total INTEGER DEFAULT 0,                 -- STOCK TOTAL
    stock_15ml INTEGER DEFAULT 0,                  -- STOCK_15ML
    stock_30ml INTEGER DEFAULT 0,                  -- STOCK_30ML
    stock_70ml INTEGER DEFAULT 0,                  -- STOCK_70ML

    -- Additional fields
    description TEXT,
    alert_threshold INTEGER DEFAULT 5,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_alert ON public.products(stock_total, alert_threshold);

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow anon to browse products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to read products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON public.products;

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

-- Update RPC functions to work with new structure
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
        'low_stock_count', (SELECT COUNT(*) FROM public.products WHERE is_active = true AND stock_total <= alert_threshold),
        'total_orders', (SELECT COUNT(*) FROM public.orders),
        'total_stock_value', COALESCE(
            (SELECT SUM(
                (stock_15ml * price_15ml) +
                (stock_30ml * price_30ml) +
                (stock_70ml * price_70ml)
            ) FROM public.products WHERE is_active = true), 0
        )
    ) INTO result;

    RETURN result;
END;
$$;

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
      AND stock_total <= threshold
    ORDER BY stock_total ASC, name ASC;
END;
$$;

-- Grant permissions
GRANT ALL ON public.products TO anon, authenticated, service_role;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'Products table structure updated to match MonStock_all.csv format!';
END $$;
