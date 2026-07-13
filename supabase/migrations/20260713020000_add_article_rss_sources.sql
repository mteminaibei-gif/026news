-- ============================================================================
--  Add article-focused (non-news) RSS sources: long-form / analysis / essay
--  publications. These are aggregated into the articles table and surfaced
--  on the public /articles page.
-- ============================================================================
INSERT INTO public.rss_feeds (name, feed_url, category_id, is_active)
VALUES
  ('Wired',               'https://www.wired.com/feed/rss',                  (SELECT category_id FROM categories WHERE name = 'Tech'),       true),
  ('TechCrunch',          'https://techcrunch.com/feed/',                    (SELECT category_id FROM categories WHERE name = 'Tech'),       true),
  ('HackerNoon',          'https://hackernoon.com/feed',                     (SELECT category_id FROM categories WHERE name = 'Tech'),       true),
  ('The Verge',           'https://www.theverge.com/rss/index.xml',          (SELECT category_id FROM categories WHERE name = 'Tech'),       true),
  ('Ars Technica',        'https://feeds.arstechnica.com/arstechnica/index', (SELECT category_id FROM categories WHERE name = 'Tech'),       true),
  ('MIT Technology Review','https://www.technologyreview.com/feed/',         (SELECT category_id FROM categories WHERE name = 'Tech'),       true),
  ('Quanta Magazine',     'https://www.quantamagazine.org/feed/',           (SELECT category_id FROM categories WHERE name = 'Science'),    true),
  ('ScienceDaily',        'https://www.sciencedaily.com/rss/all.xml',        (SELECT category_id FROM categories WHERE name = 'Science'),    true),
  ('Stratechery',         'https://stratechery.com/feed/',                   (SELECT category_id FROM categories WHERE name = 'Business'),   true),
  ('Wait But Why',        'https://waitbutwhy.com/?format=rss',              (SELECT category_id FROM categories WHERE name = 'Freelance'),  true),
  ('Longreads',           'https://longreads.com/feed/',                     (SELECT category_id FROM categories WHERE name = 'Freelance'),  true),
  ('The Atlantic',        'https://www.theatlantic.com/feed/all/',          (SELECT category_id FROM categories WHERE name = 'Freelance'),  true),
  ('The Marginalian',     'https://www.themarginalian.org/feed/',           (SELECT category_id FROM categories WHERE name = 'Freelance'),  true)
ON CONFLICT (feed_url) DO NOTHING;
