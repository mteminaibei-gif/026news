#!/bin/bash
# Run this migration in Supabase Dashboard (SQL Editor) or using psql

echo "026News Region Prioritization Migration"
echo "========================================"
echo ""
echo "Option 1: Via Supabase Dashboard"
echo "1. Go to https://dvvbafgpluxvaieguiwm.supabase.co"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of: supabase/migrations/20240710000000_region_prioritization.sql"
echo "4. Click 'Run'"
echo ""
echo "Option 2: Via psql (if installed)"
echo "psql \"postgresql://postgres:\$DB_PASSWORD@dvvbafgpluxvaieguiwm.supabase.co:5432/postgres\" -f supabase/migrations/20240710000000_region_prioritization.sql"
echo ""
echo "Option 3: Via psql with connection string"
echo "export PGPASSWORD='your_database_password'"
echo "psql -h dvvbafgpluxvaieguiwm.supabase.co -p 5432 -U postgres -d postgres -f supabase/migrations/20240710000000_region_prioritization.sql"
echo ""
