-- Add actor_id + metadata to notifications so message/activity notifications
-- can carry context (who triggered it, related ids) without breaking the insert.
-- The messages API already inserts these columns; this migration makes the
-- schema match so new-message notifications are actually persisted.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS actor_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifications_actor ON public.notifications(actor_id);
