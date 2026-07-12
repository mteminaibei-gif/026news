-- Re-hash demo passwords with explicit bcrypt cost 10 (GoTrue's default),
-- in case GoTrue's bcrypt verifier rejects the lower default cost.
UPDATE auth.users
SET encrypted_password = extensions.crypt('Password123!', extensions.gen_salt('bf', 10))
WHERE email IN ('admin@026newsblog.com','journalist@026newsblog.com','reader@026newsblog.com');
