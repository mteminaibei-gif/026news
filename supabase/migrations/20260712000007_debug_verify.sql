-- Debug: does the stored encrypted_password verify 'Password123!' in Postgres?
TRUNCATE public._debug_hashes;
INSERT INTO public._debug_hashes (email, hp)
SELECT email,
  CASE WHEN encrypted_password = extensions.crypt('Password123!', encrypted_password)
       THEN 'MATCH'
       ELSE 'NOMATCH:' || left(encrypted_password, 12) END
FROM auth.users
WHERE email IN ('admin@026newsblog.com','journalist@026newsblog.com','reader@026newsblog.com');
