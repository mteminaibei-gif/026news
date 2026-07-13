-- Enable realtime change events on the users table so the admin
-- user-management panels can update live as accounts are created,
-- suspended, promoted, etc.
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
