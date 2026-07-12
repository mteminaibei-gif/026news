-- ============================================================
--  026News — Cleanup orphan migration version (20260712000003)
--  An earlier push recorded a migration under the 8-digit version
--  '20260712' (filename used a short date prefix). That collided across
--  files and left a stale row in supabase_migrations. Remove it so the
--  properly-versioned 14-digit migrations record cleanly.
-- ============================================================
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20260712';
