-- ============================================================
--  026News — Manual article prioritization (admin pin/priority)
--  Lets an admin manually pin articles to the top of feeds and
--  assign a numeric priority for finer ordering.
--  Idempotent: safe to re-run.
-- ============================================================

ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Index to make "pinned first, then priority desc" ordering cheap.
CREATE INDEX IF NOT EXISTS idx_articles_pinned_priority
  ON public.articles (pinned DESC, priority DESC, created_at DESC);
