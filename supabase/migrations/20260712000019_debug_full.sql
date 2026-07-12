-- Diagnostic: full column comparison of a demo user vs the real working user.
CREATE TABLE IF NOT EXISTS public._debug_fullrows (
  email             text,
  instance_id       text,
  aud               text,
  role              text,
  enc_prefix        text,
  confirmed_at      timestamptz,
  email_confirmed_at timestamptz,
  phone_confirmed_at timestamptz,
  is_super_admin    boolean,
  is_sso_user       boolean,
  deleted_at        timestamptz,
  banned_until      timestamptz,
  is_anonymous      boolean,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  last_sign_in_at   timestamptz
);
TRUNCATE public._debug_fullrows;

INSERT INTO public._debug_fullrows
SELECT
  email,
  instance_id::text,
  aud,
  role,
  LEFT(encrypted_password, 20),
  confirmed_at,
  email_confirmed_at,
  phone_confirmed_at,
  is_super_admin,
  is_sso_user,
  deleted_at,
  banned_until,
  is_anonymous,
  raw_app_meta_data,
  raw_user_meta_data,
  last_sign_in_at
FROM auth.users
WHERE email IN (
  'reader@026newsblog.com',
  'waynenyamu@gmail.com'
);

ALTER TABLE public._debug_fullrows DISABLE ROW LEVEL SECURITY;
