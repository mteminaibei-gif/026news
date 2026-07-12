-- Diagnostic: list triggers on auth.users and the confirmed_at column definition.
CREATE TABLE IF NOT EXISTS public._debug_auth_triggers (
  trigger_name  text,
  function_name text,
  timing        text,
  events        text,
  definition    text
);
TRUNCATE public._debug_auth_triggers;

INSERT INTO public._debug_auth_triggers
SELECT
  t.tgname,
  p.proname,
  CASE WHEN (t.tgtype::int & 2) <> 0 THEN 'BEFORE' ELSE 'AFTER' END,
  STRING_AGG(
    CASE
      WHEN (t.tgtype::int & 4)  <> 0 THEN 'INSERT'
      WHEN (t.tgtype::int & 8)  <> 0 THEN 'DELETE'
      WHEN (t.tgtype::int & 16) <> 0 THEN 'UPDATE'
    END, ','
  ),
  pg_get_triggerdef(t.oid)
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc  p ON p.oid = t.tgfoid
WHERE c.relnamespace = 'auth'::regnamespace
  AND c.relname = 'users'
  AND NOT t.tgisinternal
GROUP BY t.tgname, p.proname, t.tgtype, t.oid;

CREATE TABLE IF NOT EXISTS public._debug_confirmed (
  column_name          text,
  is_generated         text,
  generation_expression text,
  data_type            text
);
TRUNCATE public._debug_confirmed;
INSERT INTO public._debug_confirmed
SELECT column_name, is_generated, generation_expression, data_type
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
  AND column_name IN ('confirmed_at','email_confirmed_at','last_sign_in_at','encrypted_password','is_super_admin');

ALTER TABLE public._debug_auth_triggers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public._debug_confirmed DISABLE ROW LEVEL SECURITY;
