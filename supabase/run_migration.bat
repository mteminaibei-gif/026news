@echo off
REM Run this migration in Supabase Dashboard (SQL Editor) or using psql

echo 026News Region Prioritization Migration
echo ========================================
echo.
echo Option 1: Via Supabase Dashboard (RECOMMENDED)
echo 1. Go to https://dvvbafgpluxvaieguiwm.supabase.co
echo 2. Navigate to SQL Editor
echo 3. Copy and paste the contents of: supabase\migrations\20240710000000_region_prioritization.sql
echo 4. Click 'Run'
echo.
echo Option 2: Via psql (if installed)
echo psql "postgresql://postgres:YOUR_PASSWORD@dvvbafgpluxvaieguiwm.supabase.co:5432/postgres" -f supabase\migrations\20240710000000_region_prioritization.sql
echo.
echo Option 3: Via Supabase CLI (requires database password)
echo supabase db push --db-url "postgresql://postgres:YOUR_PASSWORD@dvvbafgpluxvaieguiwm.supabase.co:5432/postgres"
echo.
