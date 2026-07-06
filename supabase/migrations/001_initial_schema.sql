-- ============================================================
-- 026News — Initial Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- Or: supabase db push (if using Supabase CLI)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id       SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL DEFAULT '',
  role          TEXT          NOT NULL DEFAULT 'reader'
                CHECK (role IN ('admin','journalist','reader')),
  bio           TEXT,
  profile_image VARCHAR(255),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  status        TEXT          NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','inactive','banned'))
);

-- ── 2. Categories ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  category_id  SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  description  TEXT
);

INSERT INTO categories (name, description) VALUES
  ('Politics',     'Political news and analysis'),
  ('Business',     'Business and finance news'),
  ('Tech',         'Technology and innovation'),
  ('Science',      'Science and research'),
  ('Entertainment','Entertainment and culture'),
  ('Sports',       'Sports news and results'),
  ('Freelance',    'Freelance contributor articles')
ON CONFLICT (name) DO NOTHING;

-- ── 3. Articles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  article_id        SERIAL PRIMARY KEY,
  title             VARCHAR(255)    NOT NULL,
  slug              VARCHAR(255)    NOT NULL UNIQUE,
  content           TEXT            NOT NULL,
  category_id       INT             REFERENCES categories(category_id) ON DELETE SET NULL,
  author_id         INT             REFERENCES users(user_id) ON DELETE SET NULL,
  source_reference  VARCHAR(255),
  status            TEXT            NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','under_review','published','rejected')),
  monetization_type TEXT            NOT NULL DEFAULT 'free'
                    CHECK (monetization_type IN ('free','paywall','sponsored','ad')),
  featured_image    VARCHAR(255),
  views             INT             NOT NULL DEFAULT 0,
  earnings          DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 4. Comments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  comment_id   SERIAL PRIMARY KEY,
  article_id   INT  REFERENCES articles(article_id) ON DELETE CASCADE,
  user_id      INT  REFERENCES users(user_id) ON DELETE SET NULL,
  comment_text TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       TEXT NOT NULL DEFAULT 'visible'
               CHECK (status IN ('visible','hidden','flagged'))
);

-- ── 5. Earnings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earnings (
  earning_id    SERIAL PRIMARY KEY,
  user_id       INT         REFERENCES users(user_id) ON DELETE SET NULL,
  article_id    INT         REFERENCES articles(article_id) ON DELETE SET NULL,
  amount        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  source        TEXT        NOT NULL CHECK (source IN ('ads','subscriptions','sponsored')),
  payout_status TEXT        NOT NULL DEFAULT 'pending'
                CHECK (payout_status IN ('pending','paid')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 6. Review Workflow ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_workflow (
  review_id    SERIAL PRIMARY KEY,
  article_id   INT  REFERENCES articles(article_id) ON DELETE CASCADE,
  admin_id     INT  REFERENCES users(user_id) ON DELETE SET NULL,
  review_notes TEXT,
  action       TEXT NOT NULL
               CHECK (action IN ('approved','rejected','revision_requested')),
  reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. Subscriptions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id SERIAL PRIMARY KEY,
  user_id         INT  REFERENCES users(user_id) ON DELETE CASCADE,
  plan_type       TEXT NOT NULL DEFAULT 'free'
                  CHECK (plan_type IN ('free','premium','pro')),
  payment_method  TEXT NOT NULL
                  CHECK (payment_method IN ('mpesa','paypal','stripe')),
  start_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date        TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','expired','cancelled'))
);

-- ── 8. Sources ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
  source_id    SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  api_url      VARCHAR(255) NOT NULL,
  last_fetched TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','inactive'))
);

INSERT INTO sources (name, api_url) VALUES
  ('Reuters',  'https://feeds.reuters.com/reuters/topNews'),
  ('BBC News', 'https://feeds.bbci.co.uk/news/rss.xml'),
  ('CNN',      'https://rss.cnn.com/rss/edition.rss')
ON CONFLICT DO NOTHING;

-- ── 9. Analytics ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics (
  analytics_id    SERIAL PRIMARY KEY,
  article_id      INT  REFERENCES articles(article_id) ON DELETE CASCADE UNIQUE,
  views           INT NOT NULL DEFAULT 0,
  likes           INT NOT NULL DEFAULT 0,
  shares          INT NOT NULL DEFAULT 0,
  comments_count  INT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_status      ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_id   ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug        ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_comments_article_id  ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_earnings_user_id     ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_article_id ON analytics(article_id);

-- ── Row Level Security (RLS) ──────────────────────────────────
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_workflow ENABLE ROW LEVEL SECURITY;

-- Users: can read their own profile; admins can read all
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid()::text = user_id::text OR
    EXISTS (SELECT 1 FROM users u WHERE u.user_id::text = auth.uid()::text AND u.role = 'admin'));

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Articles: anyone can read published; authors can manage their own; admins can manage all
CREATE POLICY "articles_select_published" ON articles
  FOR SELECT USING (status = 'published' OR
    author_id::text = auth.uid()::text OR
    EXISTS (SELECT 1 FROM users u WHERE u.user_id::text = auth.uid()::text AND u.role = 'admin'));

CREATE POLICY "articles_insert_journalist" ON articles
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM users u WHERE u.user_id::text = auth.uid()::text AND u.role IN ('journalist','admin'))
  );

CREATE POLICY "articles_update_own_or_admin" ON articles
  FOR UPDATE USING (
    author_id::text = auth.uid()::text OR
    EXISTS (SELECT 1 FROM users u WHERE u.user_id::text = auth.uid()::text AND u.role = 'admin')
  );

-- Comments: visible comments are public; users manage their own
CREATE POLICY "comments_select_visible" ON comments
  FOR SELECT USING (status = 'visible' OR user_id::text = auth.uid()::text);

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Earnings: journalists see their own; admins see all
CREATE POLICY "earnings_select" ON earnings
  FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    EXISTS (SELECT 1 FROM users u WHERE u.user_id::text = auth.uid()::text AND u.role = 'admin')
  );

-- Review workflow: only admins
CREATE POLICY "review_workflow_admin_only" ON review_workflow
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.user_id::text = auth.uid()::text AND u.role = 'admin')
  );
