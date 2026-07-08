-- ============================================================
--  Migration: Add Kenya & Africa Media RSS Feeds
--  Date: 2026-07-08
--  Run in Supabase SQL Editor or via: supabase db push
-- ============================================================

-- First ensure Kenya and Africa categories exist
INSERT INTO public.categories (name, slug, description, icon) VALUES
  ('Kenya',   'kenya',   'Kenya news and current affairs',  '🇰🇪'),
  ('Africa',  'africa',  'Pan-African news and analysis',   '🌍'),
  ('Health',  'health',  'Health and medicine news',        '🏥')
ON CONFLICT (name) DO NOTHING;

-- ── Kenya & East Africa Media RSS Feeds ──────────────────────
INSERT INTO public.rss_feeds (name, feed_url, is_active, category_id)
SELECT name, feed_url, true, (SELECT category_id FROM public.categories WHERE slug = cat_slug)
FROM (VALUES
  -- Nation Media Group (Kenya's largest media house)
  ('Nation Africa — Top Stories',     'https://nation.africa/kenya/rss',                  'kenya'),
  ('Nation Africa — Business',        'https://nation.africa/kenya/business/rss',          'business'),
  ('Nation Africa — Politics',        'https://nation.africa/kenya/politics/rss',          'politics'),
  ('Nation Africa — Sports',          'https://nation.africa/kenya/sports/rss',            'sports'),

  -- The Standard Group
  ('The Standard — Kenya News',       'https://www.standardmedia.co.ke/rss/all_news.php',  'kenya'),
  ('The Standard — Business',        'https://www.standardmedia.co.ke/rss/business.php',  'business'),
  ('The Standard — Sports',          'https://www.standardmedia.co.ke/rss/sports.php',    'sports'),

  -- Kenya Broadcasting Corporation
  ('KBC — Kenya News',                'https://www.kbc.co.ke/feed/',                       'kenya'),

  -- Citizen Digital (Royal Media Services)
  ('Citizen Digital — Kenya',         'https://www.citizen.digital/feed',                  'kenya'),

  -- The Star Kenya
  ('The Star Kenya',                  'https://www.the-star.co.ke/rss/',                   'kenya'),

  -- Capital FM Kenya
  ('Capital FM — Business',          'https://www.capitalfm.co.ke/business/feed/',         'business'),
  ('Capital FM — Kenya News',         'https://www.capitalfm.co.ke/news/feed/',             'kenya'),

  -- Daily Nation (alternative endpoint)
  ('Daily Nation Kenya',              'https://www.nation.co.ke/kenya/rss',                'kenya'),

  -- Business Daily Africa
  ('Business Daily Africa',           'https://businessdailyafrica.com/rss',               'business'),

  -- Techweez (Kenya tech news)
  ('Techweez — Kenya Tech',           'https://techweez.com/feed/',                        'tech'),

  -- Africa News / AfricaNews
  ('Africa News',                     'https://www.africanews.com/feed/rss',               'africa'),

  -- AllAfrica
  ('AllAfrica — Kenya',               'https://allafrica.com/tools/headlines/rdf/kenya/headlines.rdf', 'kenya'),
  ('AllAfrica — East Africa',         'https://allafrica.com/tools/headlines/rdf/eastafrica/headlines.rdf', 'africa'),

  -- Quartz Africa
  ('Quartz Africa',                   'https://qz.com/africa/rss',                         'africa'),

  -- The East African
  ('The East African',                'https://www.theeastafrican.co.ke/tea/rss',           'africa')
) AS feeds(name, feed_url, cat_slug)
ON CONFLICT (feed_url) DO NOTHING;

-- ── Verification ─────────────────────────────────────────────
-- SELECT name, feed_url, is_active
-- FROM public.rss_feeds
-- WHERE category_id IN (
--   SELECT category_id FROM public.categories WHERE slug IN ('kenya','africa')
-- )
-- ORDER BY name;
