-- Reconcile live users table with the application's expected schema.
-- types.ts (and apply_schema.ts) define a social_links JSONB column that the
-- live table is missing. It is read/written by the journalist profile route
-- and the payout route, so add it to match the intended schema.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;
