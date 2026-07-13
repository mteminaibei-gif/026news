-- ============================================================================
--  Add last_login to public.users so the admin "active users (last 30 min)"
--  metric and the /api/auth/validate-account route work. The value is kept in
--  sync automatically from auth.users.last_sign_in_at via a trigger, so every
--  login updates it — no app-code changes required.
-- ============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login timestamptz;

CREATE OR REPLACE FUNCTION public.handle_auth_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.users SET last_login = NEW.last_sign_in_at
     WHERE auth_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_login ON auth.users;
CREATE TRIGGER on_auth_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_login();

-- Backfill existing accounts from their last known sign-in.
UPDATE public.users u
   SET last_login = a.last_sign_in_at
  FROM auth.users a
 WHERE u.auth_id = a.id
   AND a.last_sign_in_at IS NOT NULL
   AND u.last_login IS NULL;
