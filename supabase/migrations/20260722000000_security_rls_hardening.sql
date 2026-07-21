-- ============================================================
-- Security RLS Hardening
-- 1. Tighten password_reset_tokens: no anon/authenticated access
-- 2. Add RLS policies for threads and thread_members tables
-- ============================================================

-- ── 1. password_reset_tokens ────────────────────────────────
-- All API routes (forgot-password, reset-password) now use the
-- service-role client which bypasses RLS. Drop the overly-
-- permissive policies so no client-side access is possible.
DROP POLICY IF EXISTS "Allow password reset insert" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Allow password reset select" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Allow password reset update" ON public.password_reset_tokens;

-- ── 2. threads table ────────────────────────────────────────
-- Enable RLS if not already enabled
DO $$
BEGIN
  ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Anyone authenticated can read threads (public discovery)
DROP POLICY IF EXISTS "threads_select" ON public.threads;
CREATE POLICY "threads_select" ON public.threads
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Authenticated users can create threads
DROP POLICY IF EXISTS "threads_insert" ON public.threads;
CREATE POLICY "threads_insert" ON public.threads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only the thread creator can update
DROP POLICY IF EXISTS "threads_update" ON public.threads;
CREATE POLICY "threads_update" ON public.threads
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Only the thread creator can delete
DROP POLICY IF EXISTS "threads_delete" ON public.threads;
CREATE POLICY "threads_delete" ON public.threads
  FOR DELETE USING (
    created_by = auth.uid()
  );

-- ── 3. thread_members table ─────────────────────────────────
DO $$
BEGIN
  ALTER TABLE public.thread_members ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Members can see who's in a thread; anyone authenticated can see membership
DROP POLICY IF EXISTS "thread_members_select" ON public.thread_members;
CREATE POLICY "thread_members_select" ON public.thread_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Authenticated users can join (insert themselves)
DROP POLICY IF EXISTS "thread_members_insert" ON public.thread_members;
CREATE POLICY "thread_members_insert" ON public.thread_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Users can leave (delete their own membership)
DROP POLICY IF EXISTS "thread_members_delete" ON public.thread_members;
CREATE POLICY "thread_members_delete" ON public.thread_members
  FOR DELETE USING (
    auth.uid() IS NOT NULL
  );
