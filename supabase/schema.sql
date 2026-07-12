-- ============================================================
--  026News — Complete Supabase Database Schema
--  Run this in Supabase SQL Editor or apply via `supabase db push`
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fast full-text search on articles

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role           AS ENUM ('admin', 'journalist', 'reader');
  CREATE TYPE article_status      AS ENUM ('draft', 'under_review', 'published', 'rejected');
  CREATE TYPE monetization_type   AS ENUM ('free', 'paywall', 'sponsored', 'ad');
  CREATE TYPE review_action       AS ENUM ('approved', 'rejected', 'revision_requested');
  CREATE TYPE payout_status       AS ENUM ('pending', 'paid');
  CREATE TYPE earnings_source     AS ENUM ('ads', 'subscriptions', 'sponsored');
  CREATE TYPE subscription_plan   AS ENUM ('free', 'premium', 'pro');
  CREATE TYPE payment_method      AS ENUM ('mpesa', 'paypal', 'stripe');
  CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
  CREATE TYPE comment_status      AS ENUM ('visible', 'hidden', 'flagged');
  CREATE TYPE account_status      AS ENUM ('active', 'inactive', 'banned');
  CREATE TYPE source_status       AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Helper: auto-update updated_at ───────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ─────────────────────────────────────────────────────────────
--  TABLE: users
--  Stores all platform users (admin / journalist / reader).
--  Linked to Supabase Auth via auth.uid().
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  user_id       BIGSERIAL        PRIMARY KEY,
  auth_id       UUID             UNIQUE,          -- Supabase auth.uid()
  name          TEXT             NOT NULL,
  email         TEXT             NOT NULL UNIQUE,
  password_hash TEXT             NOT NULL DEFAULT '',
  role          user_role        NOT NULL DEFAULT 'reader',
  bio           TEXT,
  profile_image TEXT,
  social_links  JSONB            DEFAULT '{}',    -- { twitter, linkedin, website }
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  status        account_status   NOT NULL DEFAULT 'active',
  total_views   BIGINT           NOT NULL DEFAULT 0,
  rank_score    NUMERIC          NOT NULL DEFAULT 0,
  badge_level   TEXT             DEFAULT NULL,
  interests     TEXT[]           DEFAULT '{}',
  notification_prefs JSONB       DEFAULT '{}'::jsonb,
  author_application JSONB       DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email   ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role    ON public.users(role);

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: categories
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  category_id  BIGSERIAL  PRIMARY KEY,
  name         TEXT       NOT NULL UNIQUE,
  slug         TEXT       NOT NULL UNIQUE,
  description  TEXT,
  icon         TEXT,                          -- emoji or icon name
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.categories (name, slug, description, icon) VALUES
  ('Politics',       'politics',       'Political news and analysis',          '🏛️'),
  ('Business',       'business',       'Business and finance news',            '💼'),
  ('Tech',           'tech',           'Technology and innovation',             '💻'),
  ('Science',        'science',        'Science and research',                 '🔬'),
  ('Entertainment',  'entertainment',  'Entertainment and culture',            '🎬'),
  ('Sports',         'sports',         'Sports news and results',              '⚽'),
  ('Freelance',      'freelance',      'Freelance contributor articles',       '✍️')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
--  TABLE: articles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.articles (
  article_id        BIGSERIAL          PRIMARY KEY,
  title             TEXT               NOT NULL,
  slug              TEXT               NOT NULL UNIQUE,
  content           TEXT               NOT NULL,
  excerpt           TEXT,                          -- auto-generated short summary
  category_id       BIGINT             REFERENCES public.categories(category_id) ON DELETE SET NULL,
  author_id         BIGINT             REFERENCES public.users(user_id)          ON DELETE SET NULL,
  source_reference  TEXT,
  status            article_status     NOT NULL DEFAULT 'draft',
  monetization_type monetization_type  NOT NULL DEFAULT 'free',
  featured_image    TEXT,
  tags              TEXT[]             DEFAULT '{}',
  views             BIGINT             NOT NULL DEFAULT 0,
  likes             BIGINT             NOT NULL DEFAULT 0,
  earnings          NUMERIC(12, 2)     NOT NULL DEFAULT 0.00,
  created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  published_at      TIMESTAMPTZ,
  featured          BOOLEAN            NOT NULL DEFAULT FALSE,
  source_url        TEXT,
  content_hash      TEXT,                              -- SHA-256 of title+url for dedup
  is_aggregated     BOOLEAN            NOT NULL DEFAULT FALSE,
  source_name       TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_slug        ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_author_id   ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_status      ON public.articles(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_content_hash
  ON public.articles(content_hash) WHERE content_hash IS NOT NULL;

-- Full-text search index config
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE OR REPLACE FUNCTION articles_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_articles_search_vector ON public.articles;
CREATE TRIGGER trg_articles_search_vector
  BEFORE INSERT OR UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION articles_search_vector_update();

DROP TRIGGER IF EXISTS articles_updated_at ON public.articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: article_sources
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_sources (
  source_id   BIGSERIAL PRIMARY KEY,
  article_id  BIGINT    REFERENCES public.articles(article_id) ON DELETE CASCADE,
  name        TEXT      NOT NULL,
  url         TEXT      NOT NULL
);

-- ─────────────────────────────────────────────────────────────
--  TABLE: comments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  comment_id   BIGSERIAL      PRIMARY KEY,
  article_id   BIGINT         REFERENCES public.articles(article_id) ON DELETE CASCADE,
  user_id      BIGINT         REFERENCES public.users(user_id)          ON DELETE SET NULL,
  comment_text TEXT           NOT NULL,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  status       comment_status NOT NULL DEFAULT 'visible'
);

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON public.comments(article_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: analytics
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics (
  analytics_id   BIGSERIAL   PRIMARY KEY,
  article_id     BIGINT      UNIQUE REFERENCES public.articles(article_id) ON DELETE CASCADE,
  views          BIGINT      NOT NULL DEFAULT 0,
  likes          BIGINT      NOT NULL DEFAULT 0,
  shares         BIGINT      NOT NULL DEFAULT 0,
  comments_count BIGINT      NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  TABLE: earnings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.earnings (
  earning_id    BIGSERIAL       PRIMARY KEY,
  user_id       BIGINT          REFERENCES public.users(user_id)          ON DELETE SET NULL,
  article_id    BIGINT          REFERENCES public.articles(article_id) ON DELETE SET NULL,
  amount        NUMERIC(12, 2)  NOT NULL DEFAULT 0.00,
  source        earnings_source NOT NULL,
  payout_status payout_status   NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON public.earnings(user_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: review_workflow
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_workflow (
  review_id    BIGSERIAL     PRIMARY KEY,
  article_id   BIGINT        REFERENCES public.articles(article_id) ON DELETE CASCADE,
  admin_id     BIGINT        REFERENCES public.users(user_id)          ON DELETE SET NULL,
  review_notes TEXT,
  action       review_action NOT NULL,
  reviewed_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  TABLE: subscriptions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  subscription_id BIGSERIAL           PRIMARY KEY,
  user_id         BIGINT              REFERENCES public.users(user_id) ON DELETE CASCADE,
  plan_type       subscription_plan   NOT NULL DEFAULT 'free',
  payment_method  payment_method      NOT NULL,
  start_date      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  end_date        TIMESTAMPTZ         NOT NULL,
  status          subscription_status NOT NULL DEFAULT 'active'
);

-- ─────────────────────────────────────────────────────────────
--  TABLE: sources
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sources (
  source_id    BIGSERIAL     PRIMARY KEY,
  name         TEXT          NOT NULL,
  api_url      TEXT          NOT NULL UNIQUE,
  last_fetched TIMESTAMPTZ,
  status       source_status NOT NULL DEFAULT 'active'
);

-- ─────────────────────────────────────────────────────────────
--  TABLE: notifications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id BIGSERIAL   PRIMARY KEY,
  user_id         BIGINT      REFERENCES public.users(user_id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  message         TEXT        NOT NULL,
  read            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = FALSE;

-- ─────────────────────────────────────────────────────────────
--  TABLE: page_views   (granular per-article view tracking)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.page_views (
  id          BIGSERIAL    PRIMARY KEY,
  article_id  BIGINT       REFERENCES public.articles(article_id) ON DELETE CASCADE,
  user_id     BIGINT       REFERENCES public.users(user_id)       ON DELETE SET NULL,
  session_id  TEXT,
  ip_hash     TEXT,                   -- hashed for privacy (GDPR)
  referrer    TEXT,
  country     TEXT,
  device      TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_article    ON public.page_views(article_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);

-- ─────────────────────────────────────────────────────────────
--  TABLE: journalist_badges
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journalist_badges (
  badge_id        BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  badge_type      TEXT NOT NULL,   -- bronze / silver / gold / platinum / top5 / etc.
  badge_name      TEXT NOT NULL DEFAULT '',
  badge_icon      TEXT,
  badge_label     TEXT,            -- "10K Views", "Top Journalist", etc.
  description     TEXT,
  threshold_views BIGINT,
  awarded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON public.journalist_badges(user_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: journalist_rankings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journalist_rankings (
  ranking_id      BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
  total_views     BIGINT NOT NULL DEFAULT 0,
  total_earnings  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  rank_position   INT,
  rank_tier       TEXT DEFAULT 'unranked',
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journalist_rankings_views ON public.journalist_rankings(total_views DESC);
CREATE INDEX IF NOT EXISTS idx_journalist_rankings_earnings ON public.journalist_rankings(total_earnings DESC);
CREATE INDEX IF NOT EXISTS idx_journalist_rankings_tier ON public.journalist_rankings(rank_tier);

-- ─────────────────────────────────────────────────────────────
--  TABLE: payout_records (Journalist-initiated requests)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payout_records (
  payout_id       BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  payout_amount   NUMERIC(12, 2) NOT NULL,
  payout_method   TEXT NOT NULL CHECK (payout_method IN ('mpesa', 'paypal')),
  phone_number    TEXT,
  email_address   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_id  TEXT,
  error_message   TEXT,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  UNIQUE(transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_payout_records_user ON public.payout_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_records_status ON public.payout_records(status);

-- ─────────────────────────────────────────────────────────────
--  TABLE: article_revenue
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_revenue (
  revenue_id      BIGSERIAL PRIMARY KEY,
  article_id      BIGINT NOT NULL UNIQUE REFERENCES public.articles(article_id) ON DELETE CASCADE,
  adsense_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  journalist_cut  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  platform_fee    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_views_at_split BIGINT DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_revenue_article ON public.article_revenue(article_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: rss_feeds
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rss_feeds (
  feed_id       BIGSERIAL    PRIMARY KEY,
  name          TEXT         NOT NULL,
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
INSERT INTO public.rss_feeds (name, feed_url, is_active, category_id) VALUES
  ('BBC News Top Stories', 'https://feeds.bbci.co.uk/news/rss.xml', true, 7),
  ('BBC Technology',       'https://feeds.bbci.co.uk/news/technology/rss.xml', true, 3),
  ('BBC Science',          'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', true, 4),
  ('BBC Business',         'https://feeds.bbci.co.uk/news/business/rss.xml', true, 2),
  ('Al Jazeera English',   'https://www.aljazeera.com/xml/rss/all.xml', true, 7),
  ('Reuters Top News',     'https://feeds.reuters.com/reuters/topNews', true, 7),
  ('Reuters Technology',   'https://feeds.reuters.com/reuters/technologyNews', true, 3),
  ('Reuters Business',     'https://feeds.reuters.com/reuters/businessNews', true, 2),
  ('NPR News',             'https://feeds.npr.org/1001/rss.xml', true, 7),
  ('TechCrunch',           'https://techcrunch.com/feed/', true, 3),
  ('NASA Breaking News',   'https://www.nasa.gov/rss/dyn/breaking_news.rss', true, 4)
ON CONFLICT (feed_url) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
--  TABLE: payout_requests (Admin-initiated monthly payout bundles)
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
--  FUNCTION: increment article view count
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_article_views(p_article_id BIGINT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.articles SET views = views + 1 WHERE article_id = p_article_id;
  INSERT INTO public.analytics (article_id, views)
    VALUES (p_article_id, 1)
    ON CONFLICT (article_id) DO UPDATE
      SET views = public.analytics.views + 1, updated_at = NOW();
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: full-text article search
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_articles(query TEXT, lim INT DEFAULT 20, off INT DEFAULT 0)
RETURNS TABLE (
  article_id        BIGINT,
  title             TEXT,
  slug              TEXT,
  excerpt           TEXT,
  featured_image    TEXT,
  author_name       TEXT,
  category_name     TEXT,
  published_at      TIMESTAMPTZ,
  views             BIGINT,
  rank              REAL
) LANGUAGE sql STABLE AS $$
  SELECT
    a.article_id, a.title, a.slug, a.excerpt, a.featured_image,
    u.name  AS author_name,
    c.name  AS category_name,
    a.published_at, a.views,
    ts_rank(a.search_vector, websearch_to_tsquery('english', query)) AS rank
  FROM public.articles a
  LEFT JOIN public.users      u ON u.user_id     = a.author_id
  LEFT JOIN public.categories c ON c.category_id = a.category_id
  WHERE a.status = 'published'
    AND a.search_vector @@ websearch_to_tsquery('english', query)
  ORDER BY rank DESC, a.published_at DESC
  LIMIT lim OFFSET off;
$$;

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
    INSERT INTO public.journalist_badges (user_id, badge_type, badge_name, badge_icon, badge_label, description, threshold_views)
    VALUES (
      p_user_id,
      v_badge,
      CASE v_badge
        WHEN 'bronze'   THEN 'Rising Star'
        WHEN 'silver'   THEN 'Star Contributor'
        WHEN 'gold'     THEN 'Elite Journalist'
        WHEN 'platinum' THEN 'Legend'
      END,
      CASE v_badge
        WHEN 'bronze'   THEN '🥉'
        WHEN 'silver'   THEN '🥈'
        WHEN 'gold'     THEN '🥇'
        WHEN 'platinum' THEN '👑'
      END,
      CASE v_badge
        WHEN 'bronze'   THEN '🥉 Bronze — 1K Views'
        WHEN 'silver'   THEN '🥈 Silver — 10K Views'
        WHEN 'gold'     THEN '🥇 Gold — 100K Views'
        WHEN 'platinum' THEN '💎 Platinum — 1M Views'
      END,
      CASE v_badge
        WHEN 'bronze'   THEN 'Awarded for achieving 1,000 article views'
        WHEN 'silver'   THEN 'Awarded for achieving 10,000 article views'
        WHEN 'gold'     THEN 'Awarded for achieving 100,000 article views'
        WHEN 'platinum' THEN 'Awarded for achieving 1,000,000 article views'
      END,
      CASE v_badge
        WHEN 'bronze'   THEN 1000
        WHEN 'silver'   THEN 10000
        WHEN 'gold'     THEN 100000
        WHEN 'platinum' THEN 1000000
      END::BIGINT
    )
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_workflow  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journalist_badges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journalist_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_revenue     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests     ENABLE ROW LEVEL SECURITY;

-- USERS ---
CREATE POLICY "Public profiles viewable" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

-- ARTICLES ---
CREATE POLICY "Published articles are public" ON public.articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors manage own articles" ON public.articles
  FOR ALL USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = author_id)
  );

CREATE POLICY "Admins full article access" ON public.articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- COMMENTS ---
CREATE POLICY "Visible comments are public" ON public.comments
  FOR SELECT USING (status = 'visible');

CREATE POLICY "Authenticated users post comments" ON public.comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users delete own comments" ON public.comments
  FOR DELETE USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_id)
  );

CREATE POLICY "Admins moderate comments" ON public.comments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- EARNINGS ---
CREATE POLICY "Journalists see own earnings" ON public.earnings
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_id)
  );

CREATE POLICY "Admins see all earnings" ON public.earnings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- SUBSCRIPTIONS ---
CREATE POLICY "Users see own subscriptions" ON public.subscriptions
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_id)
  );

CREATE POLICY "Users manage own subscriptions" ON public.subscriptions
  FOR ALL USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_id)
  );

-- NOTIFICATIONS ---
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR ALL USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_id)
  );

-- ANALYTICS (public read) ---
CREATE POLICY "Analytics are public" ON public.analytics
  FOR SELECT USING (true);

-- BADGES ---
CREATE POLICY "Badges are public" ON public.journalist_badges FOR SELECT USING (true);

-- RANKINGS ---
CREATE POLICY "Rankings are public" ON public.journalist_rankings FOR SELECT USING (true);

-- PAYOUT RECORDS ---
CREATE POLICY "Users see own payouts" ON public.payout_records
  FOR SELECT USING (auth.uid()::text = user_id::text OR 
    EXISTS (SELECT 1 FROM public.users WHERE user_id::text = auth.uid()::text AND role = 'admin'));

CREATE POLICY "Admins manage payouts" ON public.payout_records
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE user_id::text = auth.uid()::text AND role = 'admin'));

-- ARTICLE REVENUE ---
CREATE POLICY "Authors see own revenue" ON public.article_revenue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.articles WHERE article_id = article_revenue.article_id AND author_id::text = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM public.users WHERE user_id::text = auth.uid()::text AND role = 'admin')
  );

-- RSS FEEDS ---
CREATE POLICY "RSS feeds are public read"  ON public.rss_feeds FOR SELECT USING (true);
CREATE POLICY "Admins manage RSS feeds"    ON public.rss_feeds
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- PAYOUT REQUESTS ---
CREATE POLICY "Journalists see own payout requests" ON public.payout_requests
  FOR SELECT USING (auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_id));
CREATE POLICY "Admins manage payout requests"      ON public.payout_requests
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────────────────────
--  REALTIME — enable for live notifications & comments
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_workflow;
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journalist_rankings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_requests;

-- ─────────────────────────────────────────────────────────────
--  STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',          'avatars',          true,  2097152,  ARRAY['image/jpeg','image/png','image/webp']),
  ('article-images',   'article-images',   true,  10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('attachments',      'attachments',      false, 20971520, NULL)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Public avatar read"         ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatar"         ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Public article images read" ON storage.objects FOR SELECT USING (bucket_id = 'article-images');
CREATE POLICY "Auth upload article images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'article-images' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
--  VIEWS
-- ─────────────────────────────────────────────────────────────

-- v_articles_feed: rich article data for frontend queries
CREATE OR REPLACE VIEW public.v_articles_feed AS
SELECT
  a.article_id, a.title, a.slug, a.excerpt, a.content,
  a.status, a.monetization_type, a.featured_image,
  a.featured, a.tags, a.views, a.likes, a.earnings,
  a.created_at, a.updated_at, a.published_at,
  u.user_id   AS author_id,
  u.name      AS author_name,
  u.profile_image AS author_image,
  u.bio       AS author_bio,
  c.category_id,
  c.name      AS category_name,
  an.views    AS analytics_views,
  an.likes    AS analytics_likes,
  an.shares   AS analytics_shares,
  an.comments_count
FROM public.articles     a
LEFT JOIN public.users      u  ON u.user_id     = a.author_id
LEFT JOIN public.categories c  ON c.category_id = a.category_id
LEFT JOIN public.analytics  an ON an.article_id = a.article_id;

-- v_journalist_stats: per-journalist aggregated stats
CREATE OR REPLACE VIEW public.v_journalist_stats AS
SELECT
  u.user_id, u.name, u.email, u.profile_image, u.bio, u.status,
  COUNT(a.article_id)                                      AS total_articles,
  COUNT(a.article_id) FILTER (WHERE a.status = 'published') AS published_articles,
  COALESCE(SUM(a.views), 0)                                AS total_views,
  COALESCE(SUM(a.earnings), 0)                             AS total_earnings,
  COALESCE(SUM(e.amount) FILTER (WHERE e.payout_status = 'pending'), 0) AS pending_payout
FROM public.users u
LEFT JOIN public.articles a ON a.author_id = u.user_id
LEFT JOIN public.earnings e ON e.user_id   = u.user_id
WHERE u.role = 'journalist'
GROUP BY u.user_id, u.name, u.email, u.profile_image, u.bio, u.status;
