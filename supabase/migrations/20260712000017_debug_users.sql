-- Diagnostic: expose key auth.users fields for the demo accounts into a public
-- table so we can inspect their state via the REST API (no Docker needed).
CREATE TABLE IF NOT EXISTS public._debug_demo_users (
  email              text,
  enc_is_null        boolean,
  enc_prefix         text,
  enc_len            integer,
  instance_id        text,
  is_super_admin     boolean,
  raw_app_meta_data  jsonb,
  raw_user_meta_data jsonb,
  email_confirmed_at timestamptz,
  confirmed_at       timestamptz,
  last_sign_in_at    timestamptz
);

TRUNCATE public._debug_demo_users;

INSERT INTO public._debug_demo_users
SELECT
  email,
  encrypted_password IS NULL,
  LEFT(encrypted_password, 25),
  length(encrypted_password),
  instance_id::text,
  is_super_admin,
  raw_app_meta_data,
  raw_user_meta_data,
  email_confirmed_at,
  confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email IN (
  'admin@026newsblog.com',
  'journalist@026newsblog.com',
  'reader@026newsblog.com'
);

ALTER TABLE public._debug_demo_users DISABLE ROW LEVEL SECURITY;
