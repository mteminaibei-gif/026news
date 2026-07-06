-- ============================================================
-- 026News — Initial Supabase Schema Migration
-- ============================================================

-- ── Enable extensions ────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'journalist', 'reader');
  CREATE TYPE article_status AS ENUM ('draft', 'under_review', 'published', 'rejected');
  CREATE TYPE monetization_type AS ENUM ('free', 'paywall', 'sponsored', 'ad');
  CREATE TYPE review_action AS ENUM ('approved', 'rejected', 'revision_requested');
  CREATE TYPE payout_status AS ENUM ('pending', 'paid');
  CREATE TYPE earnings_source AS ENUM ('ads', 'subscriptions', 'sponsored');
  CREATE TYPE subscription_plan AS ENUM ('free', 'premium', 'pro');
  CREATE TYPE payment_method AS ENUM ('mpesa', 'paypal', 'stripe');
  CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
  CREATE TYPE comment_status AS ENUM ('visible', 'hidden', 'flagged');
  CREATE TYPE account_status AS ENUM ('active', 'inactive', 'banned');
  CREATE TYPE source_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id      BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  role         user_role NOT NULL DEFAULT 'reader',
  bio          TEXT,
  profile_image TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       account_status NOT NULL DEFAULT 'active'
);

-- ── Categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  category_id  BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  description  TEXT
);

INSERT INTO categories (name, description) VALUES
  ('Politics', 'Political news and analysis'),
  ('Business', 'Business and finance news'),
  ('Tech', 'Technology and innovation'),
  ('Science', 'Science and research'),
  ('Entertainment', 'Entertainment and culture'),
  ('Sports', 'Sports news and results'),
  ('Freelance', 'Freelance contributor articles')
ON CONFLICT (name) DO NOTHING;

-- ── Articles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  article_id         BIGSERIAL PRIMARY KEY,
  title              TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  content            TEXT NOT NULL,
  category_id        BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
  author_id          BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  source_reference   TEXT,
  status             article_status NOT NULL DEFAULT 'draft',
  monetization_type  monetization_type NOT NULL DEFAULT 'free',
  featured_image     TEXT,
  views              BIGINT NOT NULL DEFAULT 0,
  earnings           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Comments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  comment_id   BIGSERIAL PRIMARY KEY,
  article_id   BIGINT REFERENCES articles(article_id) ON DELETE CASCADE,
  user_id      BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  comment_text TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       comment_status NOT NULL DEFAULT 'visible'
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id);

-- ── Analytics ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics (
  analytics_id   BIGSERIAL PRIMARY KEY,
  article_id     BIGINT REFERENCES articles(article_id) ON DELETE CASCADE,
  views          BIGINT NOT NULL DEFAULT 0,
  likes          BIGINT NOT NULL DEFAULT 0,
  shares         BIGINT NOT NULL DEFAULT 0,
  comments_count BIGINT NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Earnings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS earnings (
  earning_id     BIGSERIAL PRIMARY KEY,
  user_id        BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  article_id     BIGINT REFERENCES articles(article_id) ON DELETE SET NULL,
  amount         NUMERIC(10, 2) NOT NULL,
  source         earnings_source NOT NULL DEFAULT 'ads',
  payout_status  payout_status NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Review Workflow ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_workflow (
  review_id    BIGSERIAL PRIMARY KEY,
  article_id   BIGINT REFERENCES articles(article_id) ON DELETE CASCADE,
  admin_id     BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  review_notes TEXT,
  action       review_action NOT NULL,
  reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Subscriptions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id BIGSERIAL PRIMARY KEY,
  user_id         BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  plan_type       subscription_plan NOT NULL DEFAULT 'free',
  payment_method  payment_method NOT NULL DEFAULT 'stripe',
  start_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date        TIMESTAMPTZ NOT NULL,
  status          subscription_status NOT NULL DEFAULT 'active'
);

-- ── Sources ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
  source_id    BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  api_url      TEXT NOT NULL,
  last_fetched TIMESTAMPTZ,
  status       source_status NOT NULL DEFAULT 'active'
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users: read public profile fields
CREATE POLICY "Public profiles are viewable" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Articles: published articles are publicly readable
CREATE POLICY "Published articles are public" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage own articles" ON articles
  FOR ALL USING (auth.uid()::text = author_id::text);

CREATE POLICY "Admins have full article access" ON articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE user_id::text = auth.uid()::text AND role = 'admin')
  );

-- Comments: visible comments are publicly readable
CREATE POLICY "Visible comments are public" ON comments
  FOR SELECT USING (status = 'visible');

CREATE POLICY "Authenticated users can post comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Earnings: journalists see only their own
CREATE POLICY "Journalists see own earnings" ON earnings
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins see all earnings" ON earnings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE user_id::text = auth.uid()::text AND role = 'admin')
  );

-- Subscriptions: users see own subscriptions
CREATE POLICY "Users see own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- ============================================================
-- Enable Realtime for live notifications
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE review_workflow;
ALTER PUBLICATION supabase_realtime ADD TABLE articles;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
