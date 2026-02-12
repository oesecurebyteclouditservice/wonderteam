#!/bin/bash

# ========================================
# Deploy Migration Script
# Applies user_id migration to Supabase
# ========================================

set -e  # Exit on error

echo "🚀 Wonder Team - Data Persistence Migration"
echo "==========================================="
echo ""

# Check if SUPABASE variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ ERROR: Missing Supabase credentials"
    echo ""
    echo "Please set the following environment variables:"
    echo "  export SUPABASE_URL='https://your-project.supabase.co'"
    echo "  export SUPABASE_SERVICE_KEY='your-service-role-key'"
    echo ""
    exit 1
fi

echo "✅ Supabase credentials found"
echo "   URL: $SUPABASE_URL"
echo ""

# Confirm before proceeding
echo "⚠️  WARNING: This migration will:"
echo "   1. Add user_id columns to products and orders tables"
echo "   2. Update all Row Level Security (RLS) policies"
echo "   3. Assign existing data to the first user in the database"
echo ""
read -p "Do you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo "📦 Running migration..."
echo ""

# Run the migration using psql via Supabase API
# Note: This requires the Supabase CLI or direct database access
# For production, you should use: supabase db push

if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    supabase db execute < migration-add-user-id.sql
else
    echo "⚠️  Supabase CLI not found"
    echo ""
    echo "Please install Supabase CLI:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or run the migration manually in your Supabase SQL Editor:"
    echo "  1. Go to: $SUPABASE_URL/project/_/sql"
    echo "  2. Copy and paste the contents of: migration-add-user-id.sql"
    echo "  3. Click 'Run'"
    echo ""
    exit 1
fi

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Restart your application: npm run dev"
echo "  2. Test authentication and data persistence"
echo "  3. Verify data isolation between users"
echo ""
