-- Debug: capture what extensions.crypt/gen_salt actually produce on this DB
CREATE TABLE IF NOT EXISTS public._debug_hashes (id serial primary key, email text, hp text);
TRUNCATE public._debug_hashes;
INSERT INTO public._debug_hashes (email, hp)
VALUES
  ('reader@026newsblog.com',   extensions.crypt('Password123!', extensions.gen_salt('bf'))),
  ('plaintest',                extensions.crypt('Password123!', NULL));
