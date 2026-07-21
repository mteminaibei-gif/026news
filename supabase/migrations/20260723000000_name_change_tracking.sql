-- Add name change tracking columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name_change_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_name_change_at TIMESTAMPTZ;

-- Create index for name change queries
CREATE INDEX IF NOT EXISTS idx_users_name_change ON public.users(name_change_count, last_name_change_at);