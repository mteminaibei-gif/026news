-- Enable pg_cron so scheduled SQL jobs can run inside Supabase.
-- (Scheduling the RSS aggregation itself is done via Supabase Dashboard →
--  Edge Functions → Schedule, pointing at the `aggregate-feeds` function.
--  That keeps the heavy RSS work on Supabase's compute, not Vercel's free tier.)
create extension if not exists pg_cron;

-- Example scheduled SQL job (optional): keep the rss_feeds table healthy by
-- clearing stale errors nightly. Uncomment and adjust as needed.
-- select cron.schedule(
--   'reset-stale-feed-errors',
--   '0 3 * * *',
--   $$ update rss_feeds set last_error = null where last_error is not null; $$
-- );
