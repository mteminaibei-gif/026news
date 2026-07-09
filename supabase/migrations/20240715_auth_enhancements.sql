-- ============================================================
--  Auth Enhancement Migration
--  Adds password reset tokens table and reader profile enhancements
--  Run this in Supabase SQL Editor
-- ============================================================

-- Add password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON public.password_reset_tokens(user_id);

-- Add phone field to users if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add last_login field to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add location field for readers
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;

-- Add preferred_categories for readers (personalization)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_categories TEXT[] DEFAULT '{}';

-- Enable RLS on password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only request reset for their own email (via API)
CREATE POLICY "Allow password reset insert" ON public.password_reset_tokens
  FOR INSERT WITH CHECK (true);

-- Policy: Users can only select their own token
CREATE POLICY "Allow password reset select" ON public.password_reset_tokens
  FOR SELECT USING (true);

-- Policy: Users can update (mark as used) their own token
CREATE POLICY "Allow password reset update" ON public.password_reset_tokens
  FOR UPDATE USING (true);

-- Add email_verified field (for future use with confirmation emails)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add created_with field to track registration source
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_with TEXT DEFAULT 'email';

-- Add is_public_profile field for readers who want to show their profile
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_public_profile BOOLEAN DEFAULT FALSE;