-- Reset demo passwords to the documented Password123! (standard bcrypt hash)
UPDATE auth.users
SET encrypted_password = extensions.crypt('Password123!', extensions.gen_salt('bf', 10))
WHERE email IN ('admin@026newsblog.com','journalist@026newsblog.com','reader@026newsblog.com');
