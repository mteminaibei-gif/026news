-- ============================================================
-- Name Change Tracking
-- Adds columns to limit name changes (max 3 changes per 90 days)
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name_change_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_name_change_at TIMESTAMPTZ;

-- Index for querying recent name changes
CREATE INDEX IF NOT EXISTS idx_users_last_name_change ON public.users(last_name_change_at);

-- Comment for documentation
COMMENT ON COLUMN public.users.name_change_count IS 'Number of name changes in the current 90-day window';
COMMENT ON COLUMN public.users.last_name_change_at IS 'Timestamp of the most recent name change';