-- Test: swap bcrypt prefix $2a$ -> $2b$ (same algorithm, some GoTrue builds
-- only accept $2b$). Safe: just relabels the existing valid hash.
UPDATE auth.users
SET encrypted_password = '$2b$' || substring(encrypted_password from 5)
WHERE email = 'reader@026newsblog.com' AND encrypted_password LIKE '$2a$%';
