-- Add online status tracking columns to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS show_online_status BOOLEAN NOT NULL DEFAULT true;

-- Index for quick online-status lookups
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active);
