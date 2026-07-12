CREATE TABLE IF NOT EXISTS public._debug_fullcmp (email text, row_json jsonb);
TRUNCATE public._debug_fullcmp;
INSERT INTO public._debug_fullcmp
SELECT email, to_jsonb(u)
FROM auth.users u
WHERE email IN ('admintest@026newsblog.com', 'reader@026newsblog.com');
ALTER TABLE public._debug_fullcmp DISABLE ROW LEVEL SECURITY;
