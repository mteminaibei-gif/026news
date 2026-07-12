-- Test: set reader password to a plain alphanumeric to rule out special-char issues
UPDATE auth.users
SET encrypted_password = extensions.crypt('demo1234', extensions.gen_salt('bf', 10))
WHERE email = 'reader@026newsblog.com';
