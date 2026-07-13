-- ============================================================================
--  Fix infinite recursion (42P17) in RLS policies that reference public.users
--  inside a policy defined ON public.users (or other tables' admin checks).
--  Replace every "EXISTS (SELECT 1 FROM public.users WHERE ... role='admin')"
--  with the SECURITY DEFINER helper is_admin(), which bypasses RLS and stops
--  the recursion. Also adds a site_settings table for admin publish limits.
-- ============================================================================

-- Helper: returns true when the calling user is an admin.
-- SECURITY DEFINER makes it run as the table owner, so it does NOT trigger
-- users RLS (which is what caused the infinite recursion).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
$$;

-- users: the recursive self-referencing SELECT policy
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (
    (auth.uid())::text = (user_id)::text OR public.is_admin()
  );

-- articles: admin full access
DROP POLICY IF EXISTS "Admins full article access" ON public.articles;
CREATE POLICY "Admins full article access" ON public.articles
  FOR ALL USING (public.is_admin());

-- comments: admin moderation
DROP POLICY IF EXISTS "Admins moderate comments" ON public.comments;
CREATE POLICY "Admins moderate comments" ON public.comments
  FOR ALL USING (public.is_admin());

-- earnings: admin read/write
DROP POLICY IF EXISTS "Admins see all earnings" ON public.earnings;
CREATE POLICY "Admins see all earnings" ON public.earnings
  FOR ALL USING (public.is_admin());

-- payouts: users see own + admin manage
DROP POLICY IF EXISTS "Users see own payouts" ON public.payout_records;
CREATE POLICY "Users see own payouts" ON public.payout_records
  FOR SELECT USING (auth.uid()::text = user_id::text OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage payouts" ON public.payout_records;
CREATE POLICY "Admins manage payouts" ON public.payout_records
  FOR ALL USING (public.is_admin());

-- article_revenue: authors see own + admin
DROP POLICY IF EXISTS "Authors see own revenue" ON public.article_revenue;
CREATE POLICY "Authors see own revenue" ON public.article_revenue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.articles
      WHERE article_id = article_revenue.article_id AND author_id::text = auth.uid()::text
    ) OR public.is_admin()
  );

-- rss_feeds: admin manage
DROP POLICY IF EXISTS "Admins manage RSS feeds" ON public.rss_feeds;
CREATE POLICY "Admins manage RSS feeds" ON public.rss_feeds
  FOR ALL USING (public.is_admin());

-- ============================================================================
--  site_settings: key/value store for admin-managed configuration
--  (e.g. how many in-house vs sourced articles to keep published).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read settings — needed for the public site feed.
CREATE POLICY "Settings are public read" ON public.site_settings
  FOR SELECT USING (true);

-- Only admins can manage settings.
CREATE POLICY "Admins manage settings" ON public.site_settings
  FOR ALL USING (public.is_admin());

-- Default publish limits: how many published articles to surface per type.
INSERT INTO public.site_settings (key, value)
VALUES ('publish_limits', '{"inhouse": 10, "sourced": 10}'::jsonb)
ON CONFLICT (key) DO NOTHING;
