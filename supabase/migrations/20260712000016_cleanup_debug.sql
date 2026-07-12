-- Cleanup of diagnostic artifacts left by the login-debugging migrations.
-- Drops the temporary _debug_* tables created in public during investigation.
-- The demo user rows themselves are intentionally kept (see 20260712000001_seed_demo.sql).

DROP TABLE IF EXISTS public._debug_hashes;
DROP TABLE IF EXISTS public._debug_triggers;
DROP TABLE IF EXISTS public._debug_user;
DROP TABLE IF EXISTS public._debug_row;
