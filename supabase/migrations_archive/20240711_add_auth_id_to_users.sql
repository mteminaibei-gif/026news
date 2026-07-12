-- ============================================================
--  Migration: Add auth_id column to users table
--  Date: 2024-07-11
--  Purpose: Link users to Supabase Auth via auth_id (UUID)
--           This is required for RLS policies that check auth.uid()
-- ============================================================

-- Add auth_id column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Create index on auth_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- ============================================================
--  Migration complete
-- ============================================================
-- Summary:
-- 1. Added auth_id column to users table (UUID type)
-- 2. Made it UNIQUE to ensure one-to-one mapping with Supabase Auth
-- 3. Created index for performance
-- 
-- This column links users to Supabase authentication and is used in:
-- - RLS policies for access control
-- - User profile creation workflows
-- - Authentication-based data filtering
