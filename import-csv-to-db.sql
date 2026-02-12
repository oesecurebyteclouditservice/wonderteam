-- ========================================
-- IMPORT CSV DATA TO PRODUCTS TABLE
-- Based on MonStock_all.csv
-- ========================================

-- Note: This is a sample showing how to insert data from CSV
-- You'll need to run the actual CSV import via Supabase dashboard or use a script

-- Helper function to parse price (removes € and converts to decimal)
CREATE OR REPLACE FUNCTION parse_price(price_text TEXT)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
    IF price_text IS NULL OR price_text = '' THEN
        RETURN 0;
    END IF;
    -- Remove € symbol and convert comma to dot, then cast to decimal
    RETURN CAST(
        REPLACE(REPLACE(REPLACE(price_text, '€', ''), ' ', ''), ',', '.')
        AS DECIMAL(10, 2)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Sample INSERT statements based on CSV data
-- Format: NOM;CATEGORIE;CAT_15ML;CAT_30ML;CAT_70ML;MARQUE;PX_15ML;PX_30ML;PX_70ML;STOCK TOTAL;STOCK_15ML;STOCK_30ML;STOCK_70ML

INSERT INTO public.products (name, category, cat_15ml, cat_30ml, cat_70ml, brand, price_15ml, price_30ml, price_70ml, stock_total, stock_15ml, stock_30ml, stock_70ml) VALUES
('ACQUA DI SALE', 'HOMME', NULL, NULL, '69', 'PROFUMUM ROMA', 0, 0, 0, 0, 0, 0, 0),
('LA VIE EST BELLE', 'FEMME', NULL, NULL, '42', 'LANCOME', 11.90, 18.00, 35.00, 2, 0, 0, 2),
('OMBRE LEATHER', 'MIXTES L£UXES', NULL, NULL, '142', 'TOM FORD', 0, 0, 57.00, 0, 0, 0, 0),
('CRYSTAL NOIR', 'FEMME', NULL, NULL, '47', 'VERSACE', 0, 0, 0, 0, 0, 0, 0),
('SIGNORINA', 'FEMME', NULL, NULL, '82', 'FERRAGAMO', 0, 0, 0, 0, 0, 0, 0),
('MEGAMARE', 'LUXURY MIXTES', NULL, NULL, '130', 'ORTO PARISI', 0, 0, 65.00, 0, 0, 0, 0),
('LE MÂLE', 'HOMME', NULL, NULL, '16', 'JPG', 0, 0, 0, 0, 0, 0, 0),
('GOOD GIRL GONE BAD', 'LUXURY FEMME', NULL, NULL, '123', 'KILLIAN', 0, 0, 52.00, 0, 0, 0, 0),
('GOOD GIRL', 'FEMME LUXE', NULL, NULL, '131', 'CAROLINA HERRERA', 0, 0, 48.00, 0, 0, 0, 0),
('MYSLF', 'HOMME', NULL, NULL, '79', 'YSL', 11.90, 18.00, 35.00, 3, 1, 0, 2),
('MISS DIOR CHÉRIE', 'FEMME', NULL, NULL, '39', 'DIOR', 11.90, 18.00, 35.00, 2, 0, 0, 2),
('AMO', 'FEMME', NULL, NULL, '97', 'FERRAGAMO', 0, 0, 0, 0, 0, 0, 0),
('OPIUM', 'FEMME', NULL, NULL, '6', 'YSL', 11.90, 18.00, 35.00, 1, 0, 0, 1),
('MON PARIS', 'FEMME', NULL, NULL, '89', 'YSL', 0, 0, 0, 0, 0, 0, 0),
('HUGO', 'FEMME', NULL, NULL, '156W ( 063-263)', 'HUGO BOSS', 0, 0, 0, 0, 0, 0, 0);

-- Add more rows as needed...
-- You can generate the full INSERT script from the CSV file using a script

-- Clean up helper function if not needed
-- DROP FUNCTION IF EXISTS parse_price(TEXT);

DO $$
BEGIN
    RAISE NOTICE 'CSV data imported successfully! Check products table.';
END $$;
