-- ========================================
-- DATA PERSISTENCE VERIFICATION SCRIPT
-- Run this to verify the migration worked correctly
-- ========================================

-- ========================================
-- 1. CHECK SCHEMA CHANGES
-- ========================================

\echo '========================================='
\echo '1. CHECKING SCHEMA CHANGES'
\echo '========================================='
\echo ''

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

\echo ''
\echo '========================================='
\echo '2. CHECKING RLS POLICIES'
\echo '========================================='
\echo ''

-- List all policies for products table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'clients', 'orders', 'order_items', 'transactions')
ORDER BY tablename, policyname;

\echo ''
\echo '========================================='
\echo '3. DATA INTEGRITY CHECK'
\echo '========================================='
\echo ''

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

\echo ''
\echo '========================================='
\echo '4. ORPHANED DATA CHECK'
\echo '========================================='
\echo ''

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

\echo ''
\echo '========================================='
\echo '5. RPC FUNCTIONS TEST'
\echo '========================================='
\echo ''

-- Test get_dashboard_stats (requires authentication context)
-- This will fail if not run as an authenticated user
-- SELECT public.get_dashboard_stats();

\echo 'To test RPC functions, run them from your application while authenticated'
\echo ''
\echo '========================================='
\echo 'VERIFICATION COMPLETE'
\echo '========================================='
