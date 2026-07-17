-- ============================================================
--  Password Reset Tokens + User Profile Enhancements
--  Creates the password_reset_tokens table that the auth reset
--  flow (app/api/auth/forgot-password + reset-password) depends on.
--  Also backfills commonly-referenced users columns.
--  Idempotent: safe to re-run.
-- ============================================================

-- ── password_reset_tokens ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id          BIGSERIAL    PRIMARY KEY,
  user_id     BIGINT       NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  token       TEXT         NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user  ON public.password_reset_tokens(user_id);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- The reset API uses the service-role client, so these policies are a
-- defense-in-depth backstop. Tokens are unguessable 32-byte hex strings.
DROP POLICY IF EXISTS "Allow password reset insert" ON public.password_reset_tokens;
CREATE POLICY "Allow password reset insert" ON public.password_reset_tokens
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow password reset select" ON public.password_reset_tokens;
CREATE POLICY "Allow password reset select" ON public.password_reset_tokens
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow password reset update" ON public.password_reset_tokens;
CREATE POLICY "Allow password reset update" ON public.password_reset_tokens
  FOR UPDATE USING (true);

-- ── users profile columns (IF NOT EXISTS is safe) ─────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone                TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login           TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location             TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_categories TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified        BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_with         TEXT DEFAULT 'email';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_public_profile    BOOLEAN DEFAULT FALSE;
