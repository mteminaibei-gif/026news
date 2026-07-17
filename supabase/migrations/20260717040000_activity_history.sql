-- ── Per-user activity history (reads / listens / watches) ────────────────
-- Lets each user see their own realtime record of articles read, radio
-- stations listened to, and TV channels watched. RLS guarantees a user can
-- only ever read/write their own rows.

CREATE TABLE IF NOT EXISTS public.article_reads (
  read_id     BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  article_id  BIGINT NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_article_reads_user ON public.article_reads(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_reads_article ON public.article_reads(article_id);

CREATE TABLE IF NOT EXISTS public.listen_history (
  listen_id   BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  station_id  TEXT NOT NULL,
  station_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listen_history_user ON public.listen_history(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.watch_history (
  watch_id    BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  channel_id  TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id, created_at DESC);

-- ── RLS: each user sees only their own activity ──────────────────────────
ALTER TABLE public.article_reads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listen_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own reads"  ON public.article_reads;
CREATE POLICY "Own reads" ON public.article_reads
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = article_reads.user_id));

DROP POLICY IF EXISTS "Own listens" ON public.listen_history;
CREATE POLICY "Own listens" ON public.listen_history
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = listen_history.user_id));

DROP POLICY IF EXISTS "Own watches" ON public.watch_history;
CREATE POLICY "Own watches" ON public.watch_history
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = watch_history.user_id));

-- ── Realtime publication ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'article_reads') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.article_reads;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'listen_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listen_history;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'watch_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_history;
  END IF;
END $$;
