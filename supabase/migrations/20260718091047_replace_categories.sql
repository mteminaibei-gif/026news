-- ============================================================================
--  Replace all categories with the 026connet! editorial taxonomy.
--  articles.category_id is ON DELETE SET NULL, so existing articles become
--  uncategorized and can be re-categorised via auto-categorize or manually.
-- ============================================================================

-- Ensure icon column exists (added in reconcile migration but may not be live)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;

BEGIN;

DELETE FROM public.categories;

INSERT INTO public.categories (name, slug, description, icon) VALUES
  ('World Updates',             'world-updates',        'Global headlines and international affairs',                          '🌐'),
  ('Kenya Focus',               'kenya-focus',          'Local and national coverage',                                         '🇰🇪'),
  ('Politics & Governance',     'politics-governance',  'Government, policy, and leadership stories',                          '🏛️'),
  ('Business & Economy',        'business-economy',     'Markets, startups, and financial insights',                           '💼'),
  ('Tech & Innovation',         'tech-innovation',      'AI, gadgets, and digital trends',                                     '💻'),
  ('Health & Wellness',         'health-wellness',      'Medical news, fitness, and lifestyle tips',                           '🏥'),
  ('Arts & Culture',            'arts-culture',         'Music, film, literature, and traditions',                             '🎭'),
  ('Sports Arena',              'sports-arena',         'Football, athletics, and major tournaments',                          '⚽'),
  ('Opinion & Analysis',        'opinion-analysis',     'Editorials, commentary, and debates',                                 '💭'),
  ('Trending Now',              'trending-now',         'Viral stories and social buzz',                                       '🔥'),
  ('Features & Profiles',       'features-profiles',    'Human-interest stories and interviews',                               '📰'),
  ('Environment & Climate',     'environment-climate',  'Sustainability and nature updates',                                   '🌿');

COMMIT;
