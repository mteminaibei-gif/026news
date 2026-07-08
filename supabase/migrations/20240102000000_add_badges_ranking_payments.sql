-- ============================================================
-- Add Badges, Ranking, and Payment Tracking
-- ============================================================

-- ── Journalist Badges ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS journalist_badges (
  badge_id        BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  badge_type      TEXT NOT NULL,
  badge_name      TEXT NOT NULL,
  badge_icon      TEXT,
  description     TEXT,
  threshold_views BIGINT,
  awarded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- ── Journalist Rankings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS journalist_rankings (
  ranking_id      BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  total_views     BIGINT NOT NULL DEFAULT 0,
  total_earnings  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  rank_position   INT,
  rank_tier       TEXT DEFAULT 'unranked',
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Payout Records ──────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_records (
  payout_id       BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
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

-- ── Revenue Tracking per Article ──────────────────────────
CREATE TABLE IF NOT EXISTS article_revenue (
  revenue_id      BIGSERIAL PRIMARY KEY,
  article_id      BIGINT NOT NULL UNIQUE REFERENCES articles(article_id) ON DELETE CASCADE,
  adsense_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  journalist_cut  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  platform_cut    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_views_at_split BIGINT DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes for rankings and quick queries ──────────────────
CREATE INDEX IF NOT EXISTS idx_journalist_rankings_views ON journalist_rankings(total_views DESC);
CREATE INDEX IF NOT EXISTS idx_journalist_rankings_earnings ON journalist_rankings(total_earnings DESC);
CREATE INDEX IF NOT EXISTS idx_journalist_rankings_tier ON journalist_rankings(rank_tier);
CREATE INDEX IF NOT EXISTS idx_payout_records_user ON payout_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_records_status ON payout_records(status);
CREATE INDEX IF NOT EXISTS idx_article_revenue_article ON article_revenue(article_id);

-- ── RLS Policies ──────────────────────────────────────────
ALTER TABLE journalist_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revenue ENABLE ROW LEVEL SECURITY;

-- Public can view badges
CREATE POLICY "Badges are viewable by all" ON journalist_badges FOR SELECT USING (true);

-- Public can view rankings
CREATE POLICY "Rankings are public" ON journalist_rankings FOR SELECT USING (true);

-- Users can view own payouts; admins see all
CREATE POLICY "Users see own payouts" ON payout_records
  FOR SELECT USING (auth.uid()::text = user_id::text OR 
    EXISTS (SELECT 1 FROM users WHERE user_id::text = auth.uid()::text AND role = 'admin'));

-- Admins manage payouts
CREATE POLICY "Admins manage payouts" ON payout_records
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE user_id::text = auth.uid()::text AND role = 'admin'));

-- Article revenue visible to author and admin
CREATE POLICY "Authors see own revenue" ON article_revenue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE article_id = article_revenue.article_id AND author_id::text = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM users WHERE user_id::text = auth.uid()::text AND role = 'admin')
  );

-- ============================================================
-- Enable Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE journalist_rankings;
ALTER PUBLICATION supabase_realtime ADD TABLE payout_records;
