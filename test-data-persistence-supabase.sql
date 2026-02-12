-- ========================================
-- DATA PERSISTENCE VERIFICATION SCRIPT
-- Version compatible Supabase SQL Editor
-- ========================================

-- ========================================
-- 1. CHECK SCHEMA CHANGES
-- ========================================

SELECT '=========================================' AS info;
SELECT '1. CHECKING SCHEMA CHANGES' AS info;
SELECT '=========================================' AS info;

-- Check if user_id column exists in products
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'products'
            AND column_name = 'user_id'
        )
        THEN '✅ products.user_id column exists'
        ELSE '❌ products.user_id column MISSING'
    END AS status;

-- Check if user_id column exists in orders
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'orders'
            AND column_name = 'user_id'
        )
        THEN '✅ orders.user_id column exists'
        ELSE '❌ orders.user_id column MISSING'
    END AS status;

-- ========================================
-- 2. CHECKING RLS POLICIES
-- ========================================

SELECT '=========================================' AS info;
SELECT '2. CHECKING RLS POLICIES' AS info;
SELECT '=========================================' AS info;

-- List all policies for products table
SELECT
    tablename,
    policyname,
    permissive,
    roles::text,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'clients', 'orders', 'order_items', 'transactions')
ORDER BY tablename, policyname;

-- ========================================
-- 3. DATA INTEGRITY CHECK
-- ========================================

SELECT '=========================================' AS info;
SELECT '3. DATA INTEGRITY CHECK' AS info;
SELECT '=========================================' AS info;

-- Count products by user
SELECT
    COALESCE(u.email, 'NO USER') AS user_email,
    COUNT(p.id) AS product_count
FROM public.products p
LEFT JOIN auth.users u ON p.user_id = u.id
GROUP BY u.email
ORDER BY product_count DESC;

-- Count clients by user
SELECT
    COALESCE(u.email, 'NO USER') AS user_email,
    COUNT(c.id) AS client_count
FROM public.clients c
LEFT JOIN auth.users u ON c.user_id = u.id
GROUP BY u.email
ORDER BY client_count DESC;

-- Count orders by user
SELECT
    COALESCE(u.email, 'NO USER') AS user_email,
    COUNT(o.id) AS order_count
FROM public.orders o
LEFT JOIN auth.users u ON o.user_id = u.id
GROUP BY u.email
ORDER BY order_count DESC;

-- ========================================
-- 4. ORPHANED DATA CHECK
-- ========================================

SELECT '=========================================' AS info;
SELECT '4. ORPHANED DATA CHECK' AS info;
SELECT '=========================================' AS info;

-- Check for products without user_id
SELECT
    COUNT(*) AS orphaned_products,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ No orphaned products'
        ELSE '⚠️  Found orphaned products - they should be assigned to a user'
    END AS status
FROM public.products
WHERE user_id IS NULL;

-- Check for clients without user_id
SELECT
    COUNT(*) AS orphaned_clients,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ No orphaned clients'
        ELSE '⚠️  Found orphaned clients - they should be assigned to a user'
    END AS status
FROM public.clients
WHERE user_id IS NULL;

-- Check for orders without user_id
SELECT
    COUNT(*) AS orphaned_orders,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ No orphaned orders'
        ELSE '⚠️  Found orphaned orders - they should be assigned to a user'
    END AS status
FROM public.orders
WHERE user_id IS NULL;

-- ========================================
-- 5. VERIFICATION COMPLETE
-- ========================================

SELECT '=========================================' AS info;
SELECT 'VERIFICATION COMPLETE' AS info;
SELECT '=========================================' AS info;

-- Summary of checks
SELECT
    (SELECT COUNT(*) FROM auth.users) AS total_users,
    (SELECT COUNT(*) FROM public.products) AS total_products,
    (SELECT COUNT(*) FROM public.products WHERE user_id IS NULL) AS orphaned_products,
    (SELECT COUNT(*) FROM public.clients) AS total_clients,
    (SELECT COUNT(*) FROM public.clients WHERE user_id IS NULL) AS orphaned_clients,
    (SELECT COUNT(*) FROM public.orders) AS total_orders,
    (SELECT COUNT(*) FROM public.orders WHERE user_id IS NULL) AS orphaned_orders;
