-- Add parent_comment_id to support threaded comment replies.
-- The trigger on_comment_reply (20260714200000_new_notification_triggers.sql)
-- references NEW.parent_comment_id, but the column was never created, causing
-- every comment insert to fail with error 42703.

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id INT
  REFERENCES public.comments(comment_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id
  ON public.comments(parent_comment_id);
