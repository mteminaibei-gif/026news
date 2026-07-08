-- ============================================================
--  026News — Feature Expansion Migration
--  Adds: journalist_badges, rss_feeds, payout_requests tables
--  Modifies: articles (source_url, content_hash, is_aggregated)
--            users (rank, total_views, badge_count)
-- ============================================================

-- ── Add columns to articles ───────────────────────────────────
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS source_url      TEXT,
  ADD COLUMN IF NOT EXISTS content_hash    TEXT,        -- SHA-256 of title+url for dedup
  ADD COLUMN IF NOT EXISTS is_aggregated   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS source_name     TEXT;        -- "CNN", "BBC", etc.

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_content_hash
  ON public.articles(content_hash) WHERE content_hash IS NOT NULL;

-- ── Add ranking columns to users ─────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS total_views  BIGINT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank_score   NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_level  TEXT    DEFAULT NULL; -- bronze/silver/gold/platinum

-- ─────────────────────────────────────────────────────────────
--  TABLE: journalist_badges
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journalist_badges (
  badge_id      BIGSERIAL    PRIMARY KEY,
  user_id       BIGINT       NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  badge_type    TEXT         NOT NULL,   -- bronze / silver / gold / platinum / top5 / etc.
  badge_label   TEXT         NOT NULL,   -- "10K Views", "Top Journalist", etc.
  awarded_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_type)           -- one badge type per journalist
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON public.journalist_badges(user_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: rss_feeds
--  Tracks RSS sources and their fetch state
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rss_feeds (
  feed_id       BIGSERIAL    PRIMARY KEY,
  name          TEXT         NOT NULL,   -- "CNN", "BBC News", "Al Jazeera"
  feed_url      TEXT         NOT NULL UNIQUE,
  category_id   BIGINT       REFERENCES public.categories(category_id) ON DELETE SET NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  last_fetched  TIMESTAMPTZ,
  fetch_count   BIGINT       NOT NULL DEFAULT 0,
  error_count   BIGINT       NOT NULL DEFAULT 0,
  last_error    TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed default RSS feeds
INSERT INTO public.rss_feeds (name, feed_url, is_active) VALUES
  ('BBC News Top Stories', 'https://feeds.bbci.co.uk/news/rss.xml', true),
  ('BBC Technology',       'https://feeds.bbci.co.uk/news/technology/rss.xml', true),
  ('BBC Science',          'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', true),
  ('BBC Business',         'https://feeds.bbci.co.uk/news/business/rss.xml', true),
  ('Al Jazeera English',   'https://www.aljazeera.com/xml/rss/all.xml', true),
  ('Reuters Top News',     'https://feeds.reuters.com/reuters/topNews', true),
  ('Reuters Technology',   'https://feeds.reuters.com/reuters/technologyNews', true),
  ('Reuters Business',     'https://feeds.reuters.com/reuters/businessNews', true),
  ('NPR News',             'https://feeds.npr.org/1001/rss.xml', true),
  ('TechCrunch',           'https://techcrunch.com/feed/', true),
  ('NASA Breaking News',   'https://www.nasa.gov/rss/dyn/breaking_news.rss', true)
ON CONFLICT (feed_url) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
--  TABLE: payout_requests
--  Tracks per-journalist payout disbursements
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payout_requests (
  payout_id       BIGSERIAL     PRIMARY KEY,
  user_id         BIGINT        NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL,
  platform_fee    NUMERIC(10,2) NOT NULL,   -- 50% retained
  journalist_cut  NUMERIC(10,2) NOT NULL,   -- 50% to journalist
  payment_method  TEXT          NOT NULL,   -- mpesa / paypal
  payment_ref     TEXT,                     -- transaction reference from gateway
  status          TEXT          NOT NULL DEFAULT 'pending', -- pending/processing/paid/failed
  period_start    DATE          NOT NULL,
  period_end      DATE          NOT NULL,
  initiated_by    BIGINT        REFERENCES public.users(user_id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_user   ON public.payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payout_requests(status);

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: update_journalist_rank
--  Called after each article view increment or payout
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_journalist_rank(p_user_id BIGINT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_total_views  BIGINT;
  v_total_earn   NUMERIC;
  v_score        NUMERIC;
  v_badge        TEXT;
BEGIN
  SELECT COALESCE(SUM(a.views), 0) INTO v_total_views
  FROM public.articles a WHERE a.author_id = p_user_id AND a.status = 'published';

  SELECT COALESCE(SUM(e.amount), 0) INTO v_total_earn
  FROM public.earnings e WHERE e.user_id = p_user_id;

  -- Weighted score: 1 pt per 100 views + 10 pts per $1 earned
  v_score := (v_total_views / 100.0) + (v_total_earn * 10.0);

  -- Badge tier
  IF v_total_views >= 1000000 THEN v_badge := 'platinum';
  ELSIF v_total_views >= 100000 THEN v_badge := 'gold';
  ELSIF v_total_views >= 10000  THEN v_badge := 'silver';
  ELSIF v_total_views >= 1000   THEN v_badge := 'bronze';
  ELSE v_badge := NULL;
  END IF;

  UPDATE public.users
  SET total_views = v_total_views,
      rank_score  = v_score,
      badge_level = v_badge
  WHERE user_id = p_user_id;

  -- Upsert badge row if threshold reached
  IF v_badge IS NOT NULL THEN
    INSERT INTO public.journalist_badges (user_id, badge_type, badge_label)
    VALUES (
      p_user_id,
      v_badge,
      CASE v_badge
        WHEN 'bronze'   THEN '🥉 Bronze — 1K Views'
        WHEN 'silver'   THEN '🥈 Silver — 10K Views'
        WHEN 'gold'     THEN '🥇 Gold — 100K Views'
        WHEN 'platinum' THEN '💎 Platinum — 1M Views'
      END
    )
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
END;
$$;

-- RLS for new tables
ALTER TABLE public.journalist_badges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are public"          ON public.journalist_badges FOR SELECT USING (true);
CREATE POLICY "RSS feeds are public read"  ON public.rss_feeds          FOR SELECT USING (true);
CREATE POLICY "Admins manage RSS feeds"    ON public.rss_feeds
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Journalists see own payouts" ON public.payout_requests
  FOR SELECT USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_id));
CREATE POLICY "Admins manage payouts"      ON public.payout_requests
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));
