-- Diagnostic: capture triggers on auth.users and the reader auth row (minus password)
CREATE TABLE IF NOT EXISTS public._debug_triggers (tbl text, tgname text, timing text, events text, def text);
TRUNCATE public._debug_triggers;
INSERT INTO public._debug_triggers (tbl, tgname, timing, events, def)
SELECT c.relname, t.tgname,
       CASE WHEN t.tgtype::int & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END,
       CASE WHEN t.tgtype::int & 4 = 4 THEN 'INSERT' WHEN t.tgtype::int & 8 = 8 THEN 'DELETE' WHEN t.tgtype::int & 16 = 16 THEN 'UPDATE' ELSE '' END,
       pg_get_triggerdef(t.oid)
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relnamespace = 'auth'::regnamespace AND NOT t.tgisinternal;

CREATE TABLE IF NOT EXISTS public._debug_user (email text, instance_id text, aud text, role text, email_confirmed_at text, raw_user_meta_data jsonb, raw_app_meta_data jsonb, has_pw boolean, created_at text);
TRUNCATE public._debug_user;
INSERT INTO public._debug_user (email, instance_id, aud, role, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, has_pw, created_at)
SELECT email, instance_id::text, aud, role, email_confirmed_at::text, raw_user_meta_data, raw_app_meta_data, (encrypted_password IS NOT NULL), created_at::text
FROM auth.users WHERE email = 'reader@026newsblog.com';
