-- Debug: full auth.users row for a real GoTrue user vs our seeded user
CREATE TABLE IF NOT EXISTS public._debug_row (email text, j jsonb);
TRUNCATE public._debug_row;
INSERT INTO public._debug_row (email, j)
SELECT email, to_jsonb(u) FROM auth.users u
WHERE email IN ('waynenyamu@gmail.com','reader@026newsblog.com');
