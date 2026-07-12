-- Align demo auth.users rows with the shape of a normally-created GoTrue user
-- (instance_id all-zeros, raw_app_meta_data with providers).
-- Note: confirmed_at is a generated column and must not be updated directly.
UPDATE auth.users
SET instance_id = '00000000-0000-0000-0000-000000000000',
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
    is_super_admin = NULL
WHERE email IN (
  'admin@026newsblog.com',
  'journalist@026newsblog.com',
  'reader@026newsblog.com'
);
