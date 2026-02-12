#!/usr/bin/env python3
"""
Script to convert MonStock_all.csv to SQL INSERT statements
"""

import csv
import sys

def parse_price(price_str):
    """Convert price string to decimal"""
    if not price_str or price_str.strip() == '':
        return 0.0
    # Remove € and spaces, replace comma with dot
    cleaned = price_str.replace('€', '').replace(' ', '').replace(',', '.')
    try:
        return float(cleaned)
    except:
        return 0.0

def parse_int(value):
    """Convert string to integer"""
    if not value or value.strip() == '':
        return 0
    try:
        return int(value.strip())
    except:
        return 0

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def main():
    csv_file = 'MonStock_all.csv'
    output_file = 'import-products.sql'

    print(f"Reading {csv_file}...")

    with open(csv_file, 'r', encoding='utf-8') as f:
        # Use semicolon as delimiter
        reader = csv.DictReader(f, delimiter=';')

        sql_statements = []
        sql_statements.append("-- Auto-generated INSERT statements from MonStock_all.csv\n")
        sql_statements.append("-- Truncate existing products (optional - comment out if you want to keep existing data)")
        sql_statements.append("-- TRUNCATE TABLE public.products CASCADE;\n")

        for row in reader:
            name = row.get('NOM', '').strip()
            if not name:
                continue

            category = row.get('CATEGORIE', '').strip()
            cat_15ml = row.get('CAT_15ML', '').strip()
            cat_30ml = row.get('CAT_30ML', '').strip()
            cat_70ml = row.get('CAT_70ML', '').strip()
            brand = row.get('MARQUE', '').strip()

            price_15ml = parse_price(row.get('PX_15ML', ''))
            price_30ml = parse_price(row.get('PX_30ML', ''))
            price_70ml = parse_price(row.get('PX_70ML', ''))

            stock_total = parse_int(row.get('STOCK TOTAL', ''))
            stock_15ml = parse_int(row.get('STOCK _15ML', ''))
            stock_30ml = parse_int(row.get('STOCK _30ML', ''))
            stock_70ml = parse_int(row.get('STOCK_70ML', ''))

            # Build INSERT statement
            sql = f"""INSERT INTO public.products (name, brand, category, cat_15ml, cat_30ml, cat_70ml, price_15ml, price_30ml, price_70ml, stock_total, stock_15ml, stock_30ml, stock_70ml, alert_threshold) VALUES (
    {escape_sql_string(name)},
    {escape_sql_string(brand if brand else 'Sans Marque')},
    {escape_sql_string(category if category else 'Non Classé')},
    {escape_sql_string(cat_15ml) if cat_15ml else 'NULL'},
    {escape_sql_string(cat_30ml) if cat_30ml else 'NULL'},
    {escape_sql_string(cat_70ml) if cat_70ml else 'NULL'},
    {price_15ml},
    {price_30ml},
    {price_70ml},
    {stock_total},
    {stock_15ml},
    {stock_30ml},
    {stock_70ml},
    2
);"""
            sql_statements.append(sql)

    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))

    print(f"✓ Generated {len(sql_statements)-3} INSERT statements")
    print(f"✓ Saved to {output_file}")
    print(f"\nNext steps:")
    print(f"1. Run migration-stock-structure.sql on Supabase to update table structure")
    print(f"2. Run {output_file} to import all products")

if __name__ == '__main__':
    main()
