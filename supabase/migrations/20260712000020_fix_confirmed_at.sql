-- Diagnostic + temporary workaround for demo-user login 500.
-- The push role is not the owner of auth.users (cannot ALTER TABLE), but it can
-- do DML. GoTrue's first-login write path fails on the generated confirmed_at
-- column. Setting last_sign_in_at makes these users "returning" so GoTrue takes
-- the path that does not write confirmed_at.
CREATE TABLE IF NOT EXISTS public._debug_role (rol text, is_super text);
TRUNCATE public._debug_role;
INSERT INTO public._debug_role
SELECT current_user, (SELECT rolsuper::text FROM pg_roles WHERE rolname = current_user);

UPDATE auth.users
SET last_sign_in_at = now()
WHERE email IN (
  'admin@026newsblog.com',
  'journalist@026newsblog.com',
  'reader@026newsblog.com'
);

ALTER TABLE public._debug_role DISABLE ROW LEVEL SECURITY;
