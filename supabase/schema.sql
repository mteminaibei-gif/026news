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
  status        account_status   NOT NULL DEFAULT 'active'
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
  featured          BOOLEAN            NOT NULL DEFAULT FALSE,
  views             BIGINT             NOT NULL DEFAULT 0,
  likes             BIGINT             NOT NULL DEFAULT 0,
  earnings          NUMERIC(10,2)      NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  published_at      TIMESTAMPTZ,                   -- set when status → published
  search_vector     TSVECTOR           GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_articles_slug          ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status        ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author        ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category      ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_featured      ON public.articles(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_articles_published_at  ON public.articles(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_articles_search        ON public.articles USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_articles_tags          ON public.articles USING GIN(tags);

DROP TRIGGER IF EXISTS articles_updated_at ON public.articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS articles_published_at ON public.articles;
CREATE TRIGGER articles_published_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION set_published_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: article_sources   (reference links per article)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_sources (
  id          BIGSERIAL  PRIMARY KEY,
  article_id  BIGINT     NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  name        TEXT       NOT NULL,
  url         TEXT       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_sources_article ON public.article_sources(article_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: comments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  comment_id    BIGSERIAL      PRIMARY KEY,
  article_id    BIGINT         REFERENCES public.articles(article_id) ON DELETE CASCADE,
  user_id       BIGINT         REFERENCES public.users(user_id)       ON DELETE SET NULL,
  parent_id     BIGINT         REFERENCES public.comments(comment_id) ON DELETE CASCADE,  -- nested replies
  comment_text  TEXT           NOT NULL,
  likes         BIGINT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  status        comment_status NOT NULL DEFAULT 'visible',
  flagged_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_comments_article   ON public.comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user      ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent    ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status    ON public.comments(status);

DROP TRIGGER IF EXISTS comments_updated_at ON public.comments;
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: analytics
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics (
  analytics_id    BIGSERIAL   PRIMARY KEY,
  article_id      BIGINT      UNIQUE REFERENCES public.articles(article_id) ON DELETE CASCADE,
  views           BIGINT      NOT NULL DEFAULT 0,
  unique_views    BIGINT      NOT NULL DEFAULT 0,
  likes           BIGINT      NOT NULL DEFAULT 0,
  shares          BIGINT      NOT NULL DEFAULT 0,
  comments_count  BIGINT      NOT NULL DEFAULT 0,
  avg_read_time   NUMERIC(5,2) DEFAULT 0,         -- seconds
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_article ON public.analytics(article_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: earnings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.earnings (
  earning_id     BIGSERIAL        PRIMARY KEY,
  user_id        BIGINT           REFERENCES public.users(user_id)    ON DELETE SET NULL,
  article_id     BIGINT           REFERENCES public.articles(article_id) ON DELETE SET NULL,
  amount         NUMERIC(10,2)    NOT NULL,
  source         earnings_source  NOT NULL DEFAULT 'ads',
  payout_status  payout_status    NOT NULL DEFAULT 'pending',
  transaction_ref TEXT,                           -- Stripe / M-Pesa / PayPal ref
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_user   ON public.earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON public.earnings(payout_status);

-- ─────────────────────────────────────────────────────────────
--  TABLE: review_workflow
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_workflow (
  review_id    BIGSERIAL      PRIMARY KEY,
  article_id   BIGINT         REFERENCES public.articles(article_id) ON DELETE CASCADE,
  admin_id     BIGINT         REFERENCES public.users(user_id)       ON DELETE SET NULL,
  review_notes TEXT,
  action       review_action  NOT NULL,
  reviewed_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_article ON public.review_workflow(article_id);
CREATE INDEX IF NOT EXISTS idx_review_admin   ON public.review_workflow(admin_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: subscriptions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  subscription_id   BIGSERIAL            PRIMARY KEY,
  user_id           BIGINT               REFERENCES public.users(user_id) ON DELETE CASCADE,
  journalist_id     BIGINT               REFERENCES public.users(user_id) ON DELETE SET NULL,  -- who they follow
  plan_type         subscription_plan    NOT NULL DEFAULT 'free',
  payment_method    payment_method       NOT NULL DEFAULT 'stripe',
  stripe_customer_id TEXT,
  mpesa_phone        TEXT,
  start_date        TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  end_date          TIMESTAMPTZ          NOT NULL,
  status            subscription_status  NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subs_user   ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON public.subscriptions(status);

-- ─────────────────────────────────────────────────────────────
--  TABLE: sources   (external news feed sources)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sources (
  source_id     BIGSERIAL      PRIMARY KEY,
  name          TEXT           NOT NULL,
  api_url       TEXT           NOT NULL,
  category_id   BIGINT         REFERENCES public.categories(category_id) ON DELETE SET NULL,
  fetch_interval_mins INT      DEFAULT 60,
  last_fetched  TIMESTAMPTZ,
  status        source_status  NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  TABLE: notifications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id BIGSERIAL   PRIMARY KEY,
  user_id         BIGINT      REFERENCES public.users(user_id) ON DELETE CASCADE,
  type            TEXT        NOT NULL,   -- article_approved | new_comment | etc.
  title           TEXT        NOT NULL,
  body            TEXT,
  article_id      BIGINT      REFERENCES public.articles(article_id) ON DELETE SET NULL,
  read            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user   ON public.notifications(user_id);
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
  country     TEXT(2),
  device      TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_article    ON public.page_views(article_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);

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
--  ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views     ENABLE ROW LEVEL SECURITY;

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

-- ─────────────────────────────────────────────────────────────
--  REALTIME — enable for live notifications & comments
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_workflow;
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;

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
