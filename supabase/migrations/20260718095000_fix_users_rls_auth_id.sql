-- ============================================================
--  026News — Fix users RLS so readers can read/update their
--  OWN profile. The previous policies compared auth.uid()
--  (the Supabase Auth UUID) against user_id (an integer
--  surrogate key), which NEVER matches for non-admins. The
--  correct link column is auth_id (UUID). Without this fix,
--  the client-side `from('users').select()` returns nothing
--  for every reader, so their /profile page fails to load.
--  Idempotent: drops/recreates the policies by name.
-- ============================================================

DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (
    auth.uid()::text = auth_id::text OR public.is_admin()
  );

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (
    auth.uid()::text = auth_id::text OR public.is_admin()
  )
  WITH CHECK (
    auth.uid()::text = auth_id::text OR public.is_admin()
  );
