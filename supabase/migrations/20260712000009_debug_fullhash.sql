-- Debug: full stored encrypted_password for reader
TRUNCATE public._debug_hashes;
INSERT INTO public._debug_hashes (email, hp)
SELECT email, encrypted_password FROM auth.users WHERE email = 'reader@026newsblog.com';
