-- ============================================================
--  Migration: Fix Users Table RLS INSERT Policy
--  Date: 2024-07-11
--  Purpose: Allow authenticated users to create their own profiles
-- ============================================================

-- The users table was missing an INSERT policy, preventing new user registration
-- This fixes the issue: "Profile creation failed: new row violates row-level security policy for table users"

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Service can create users" ON public.users;

-- Add INSERT policy for users table
-- Authenticated users can insert their own profile
CREATE POLICY "Users can create own profile" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() = auth_id
  );

-- Alternative: Allow service role to create users (for signup endpoint)
-- This is useful if signup happens server-side via service role key
CREATE POLICY "Service can create users" ON public.users
  FOR INSERT WITH CHECK (
    -- This allows the service role (from API handlers) to create users
    -- The auth_id will be set by the signup handler
    auth_id IS NOT NULL
  );

-- Verify SELECT policy still exists for public profiles
-- (should already exist from initial schema, just documenting)
-- SELECT policy allows anyone to read public profile fields
-- UPDATE policy already allows users to update own profile

-- ============================================================
-- Migration complete
-- ============================================================
-- Summary:
-- 1. Added INSERT policy for authenticated users (users can create own profile)
-- 2. Added INSERT policy for service role (signup endpoint can create users)
-- 3. Existing SELECT and UPDATE policies remain unchanged
-- 4. This fixes RLS violation during profile creation
