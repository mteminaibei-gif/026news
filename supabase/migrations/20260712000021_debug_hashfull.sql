CREATE TABLE IF NOT EXISTS public._debug_hashfull (email text, enc text);
TRUNCATE public._debug_hashfull;
INSERT INTO public._debug_hashfull
SELECT email, encrypted_password
FROM auth.users
WHERE email IN ('reader@026newsblog.com', 'waynenyamu@gmail.com');
ALTER TABLE public._debug_hashfull DISABLE ROW LEVEL SECURITY;
