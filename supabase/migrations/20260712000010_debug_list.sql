-- Debug: list all auth.users and the prefix of their stored password hash
TRUNCATE public._debug_hashes;
INSERT INTO public._debug_hashes (email, hp)
SELECT email, left(encrypted_password, 12) FROM auth.users ORDER BY created_at;
