-- ── Enable RLS on public.recently_played ──────────────────────────────────
-- Linter: "RLS Disabled in Public Entity: public.recently_played".
-- The table lives in the public schema exposed via PostgREST, so without RLS
-- any anon client can read AND write every row. We scope rows per user while
-- keeping the public "recently played" feed readable (rows with a null user_id
-- are the shared/anonymous feed shown to all visitors).

-- Enable RLS (policies below actually enforce scoping).
ALTER TABLE public.recently_played ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (anon or authed) may read the feed. This keeps the
-- existing GET /api/media behaviour (returns recent plays to all visitors),
-- including rows tied to a specific user only when that user is logged in.
DROP POLICY IF EXISTS "recently_played_public_read" ON public.recently_played;
CREATE POLICY "recently_played_public_read" ON public.recently_played
  FOR SELECT
  USING (
    user_id IS NULL
    OR user_id = auth.uid()
  );

-- Authenticated users may only insert rows attributed to themselves.
DROP POLICY IF EXISTS "recently_played_insert_own" ON public.recently_played;
CREATE POLICY "recently_played_insert_own" ON public.recently_played
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Users may only update/delete their own rows.
DROP POLICY IF EXISTS "recently_played_update_own" ON public.recently_played;
CREATE POLICY "recently_played_update_own" ON public.recently_played
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "recently_played_delete_own" ON public.recently_played;
CREATE POLICY "recently_played_delete_own" ON public.recently_played
  FOR DELETE
  USING (user_id = auth.uid());

-- ── Enable RLS on public.podcasts ────────────────────────────────────────
-- Linter: "RLS Disabled in Public Entity: public.podcasts".
-- `podcasts` is a curated, read-only catalog (served by GET /api/media and the
-- radio page; no client/app writes). Enable RLS and allow public read. Writes
-- are Admin-only: admins manage it via the service-role client (which bypasses
-- RLS), and we add an explicit admin-write policy as defense-in-depth.

ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authed) may read the podcast catalog.
DROP POLICY IF EXISTS "podcasts_public_read" ON public.podcasts;
CREATE POLICY "podcasts_public_read" ON public.podcasts
  FOR SELECT
  USING (true);

-- Only admins may insert/update/delete. `is_admin()` is a SECURITY DEFINER
-- helper (see 20260713010000_fix_rls_recursion_and_settings.sql) that avoids
-- recursive RLS on the users table. The service-role client bypasses RLS
-- regardless, so this also covers non-PostgREST admin tooling.
DROP POLICY IF EXISTS "podcasts_admin_write" ON public.podcasts;
CREATE POLICY "podcasts_admin_write" ON public.podcasts
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

