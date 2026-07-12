-- Cleanup of diagnostic artifacts from the demo-login debugging session.
-- Drops the temporary _debug_* tables and removes the throwaway test user
-- (admintest@026newsblog.com) created during investigation.
DROP TABLE IF EXISTS public._debug_demo_users;
DROP TABLE IF EXISTS public._debug_auth_triggers;
DROP TABLE IF EXISTS public._debug_confirmed;
DROP TABLE IF EXISTS public._debug_fullrows;
DROP TABLE IF EXISTS public._debug_role;
DROP TABLE IF EXISTS public._debug_hashfull;
DROP TABLE IF EXISTS public._debug_fullcmp;

DO $$
DECLARE v_id UUID;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = 'admintest@026newsblog.com';
  IF v_id IS NOT NULL THEN
    DELETE FROM public.users WHERE auth_id = v_id;
    DELETE FROM auth.users WHERE id = v_id;
  END IF;
END $$;
