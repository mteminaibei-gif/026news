-- FIX: demo users were inserted via raw SQL, leaving email_change and
-- email_change_token_new as NULL. GoTrue scans these into non-null `string`
-- fields and a NULL causes a scan error -> 500 "Database error" on every login.
-- GoTrue-native users have these as empty strings. Set them to '' so the rows
-- are scannable. (Other columns are left as-is; phone is kept NULL to respect
-- its UNIQUE constraint which treats '' as a colliding value.)
UPDATE auth.users
SET
  email_change               = COALESCE(email_change, ''),
  email_change_token_new     = COALESCE(email_change_token_new, '')
WHERE email IN (
  'admin@026newsblog.com',
  'journalist@026newsblog.com',
  'reader@026newsblog.com'
);
