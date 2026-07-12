-- Fix demo auth.users rows: Supabase expects instance_id NULL and a
-- raw_app_meta_data with a provider. These non-standard values can cause
-- GoTrue to return "unexpected_failure" (500) on login.
UPDATE auth.users
SET instance_id = NULL,
    raw_app_meta_data = '{"provider":"email"}'::jsonb
WHERE email IN (
  'admin@026newsblog.com',
  'journalist@026newsblog.com',
  'reader@026newsblog.com'
);
