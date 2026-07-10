-- ============================================================
-- 026News — Region Prioritization Schema Migration
-- Run this AFTER the initial schema migration
-- ============================================================

-- ── Region Code Enum ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE region_code AS ENUM (
    'ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Update existing types ────────────────────────────────────
ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'banned';

-- ─────────────────────────────────────────────────────────────
--  TABLE: regions
--  Stores country/region definitions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.regions (
  region_id   BIGSERIAL PRIMARY KEY,
  code        region_code  NOT NULL UNIQUE,
  name        TEXT         NOT NULL,
  flag        TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed default regions
INSERT INTO public.regions (code, name, flag) VALUES
  ('ke', 'Kenya', '🇰🇪'),
  ('ng', 'Nigeria', '🇳🇬'),
  ('za', 'South Africa', '🇿🇦'),
  ('gh', 'Ghana', '🇬🇭'),
  ('ug', 'Uganda', '🇺🇬'),
  ('tz', 'Tanzania', '🇹🇿'),
  ('et', 'Ethiopia', '🇪🇹'),
  ('global', 'Global', '🌍')
ON CONFLICT (code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_regions_code ON public.regions(code);

-- ─────────────────────────────────────────────────────────────
--  TABLE: user_regions
--  Stores user regional preferences
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_regions (
  user_region_id  BIGSERIAL    PRIMARY KEY,
  user_id         BIGINT       NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  region_code     region_code  NOT NULL REFERENCES public.regions(code) ON DELETE CASCADE,
  is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
  priority        INT          NOT NULL DEFAULT 0,
  preferred_categories INT[]     DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, region_code)
);

CREATE INDEX IF NOT EXISTS idx_user_regions_user ON public.user_regions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_regions_region ON public.user_regions(region_code);
CREATE INDEX IF NOT EXISTS idx_user_regions_default ON public.user_regions(user_id) WHERE is_default = TRUE;

-- Auto-update updated_at
DROP TRIGGER IF EXISTS user_regions_updated_at ON public.user_regions;
CREATE TRIGGER user_regions_updated_at
  BEFORE UPDATE ON public.user_regions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
--  TABLE: article_regions
--  Links articles to regions for location-based prioritization
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_regions (
  article_region_id BIGSERIAL   PRIMARY KEY,
  article_id        BIGINT      NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  region_code       region_code NOT NULL REFERENCES public.regions(code) ON DELETE CASCADE,
  priority          INT         NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, region_code)
);

CREATE INDEX IF NOT EXISTS idx_article_regions_article ON public.article_regions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_regions_region ON public.article_regions(region_code);
CREATE INDEX IF NOT EXISTS idx_article_regions_priority ON public.article_regions(region_code, priority DESC);

-- ─────────────────────────────────────────────────────────────
--  ALTER: users table - add region_preference JSONB field
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS region_preference JSONB;

-- ─────────────────────────────────────────────────────────────
--  ALTER: categories table - add region targeting
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS region_targeted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS regions region_code[] DEFAULT '{}';

-- Seed category regions
UPDATE public.categories SET regions = ARRAY['ke', 'ng', 'za', 'global']::region_code[] WHERE name = 'Politics';
UPDATE public.categories SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'global']::region_code[] WHERE name = 'Business';
UPDATE public.categories SET regions = ARRAY['ke', 'ng', 'global']::region_code[] WHERE name = 'Tech';
UPDATE public.categories SET regions = ARRAY['global']::region_code[] WHERE name = 'Science';
UPDATE public.categories SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'global']::region_code[] WHERE name = 'Entertainment';
UPDATE public.categories SET regions = ARRAY['ke', 'ng', 'za', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'Sports';
UPDATE public.categories SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'Freelance';

-- ─────────────────────────────────────────────────────────────
--  ALTER: articles table - add region fields
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS regions region_code[] DEFAULT '{}';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_region_priority BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────
--  ALTER: rss_feeds table - add region targeting
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS regions region_code[] DEFAULT '{}';

-- Seed RSS feed regions
UPDATE public.rss_feeds SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'BBC News Top Stories';
UPDATE public.rss_feeds SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'BBC Technology';
UPDATE public.rss_feeds SET regions = ARRAY['global']::region_code[] WHERE name = 'BBC Science';
UPDATE public.rss_feeds SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'BBC Business';
UPDATE public.rss_feeds SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'Al Jazeera English';
UPDATE public.rss_feeds SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'Reuters Top News';
UPDATE public.rss_feeds SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'Reuters Technology';
UPDATE public.rss_feeds SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'Reuters Business';
UPDATE public.rss_feeds SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'NPR News';
UPDATE public.rss_feeds SET regions = ARRAY['ke', 'ng', 'za', 'gh', 'ug', 'tz', 'et', 'global']::region_code[] WHERE name = 'TechCrunch';
UPDATE public.rss_feeds SET regions = ARRAY['global']::region_code[] WHERE name = 'NASA Breaking News';

-- ─────────────────────────────────────────────────────────────
--  VIEW: v_articles_region_priority
--  Returns articles ordered by region priority for the user's location
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_articles_region_priority AS
SELECT
  a.*,
  u.name AS author_name,
  u.profile_image AS author_image,
  c.name AS category_name,
  c.regions AS category_regions,
  ARRAY_AGG(DISTINCT ar.region_code) AS article_regions,
  ARRAY_AGG(DISTINCT ar.priority) FILTER (WHERE ar.priority > 0) AS article_priorities,
  -- Region match score (higher = more region-relevant)
  COUNT(DISTINCT ar.region_code) FILTER (
    WHERE ar.region_code = ANY(u.region_preference->>'preferred_regions'::region_code[] OR u.region_preference IS NULL)
  ) AS region_match_score
FROM public.articles a
LEFT JOIN public.users u ON u.user_id = a.author_id
LEFT JOIN public.categories c ON c.category_id = a.category_id
LEFT JOIN public.article_regions ar ON ar.article_id = a.article_id
WHERE a.status = 'published'
GROUP BY a.article_id, u.name, u.profile_image, c.name, c.regions;

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: get_region_prioritized_feed
--  Get articles with region-based prioritization
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_region_prioritized_feed(
  p_user_region region_code DEFAULT 'global',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  article_id BIGINT,
  title TEXT,
  slug TEXT,
  content TEXT,
  excerpt TEXT,
  category_id BIGINT,
  author_id BIGINT,
  source_reference TEXT,
  status TEXT,
  monetization_type TEXT,
  featured_image TEXT,
  tags TEXT[],
  views BIGINT,
  likes BIGINT,
  earnings NUMERIC,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  regions region_code[],
  author_name TEXT,
  author_image TEXT,
  category_name TEXT,
  region_match_score INT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.article_id, a.title, a.slug, a.content, a.excerpt,
    a.category_id, a.author_id, a.source_reference, a.status,
    a.monetization_type, a.featured_image, a.tags, a.views,
    a.likes, a.earnings, a.published_at, a.created_at, a.regions,
    u.name AS author_name,
    u.profile_image AS author_image,
    c.name AS category_name,
    -- Region match: count matching regions in user preference
    COALESCE(
      (SELECT COUNT(*) FROM unnest(a.regions) AS ar WHERE ar = ANY(string_to_array(p_user_region::text, ','))),
      0
    ) AS region_match_score
  FROM public.articles a
  LEFT JOIN public.users u ON u.user_id = a.author_id
  LEFT JOIN public.categories c ON c.category_id = a.category_id
  WHERE a.status = 'published'
  ORDER BY 
    -- Priority: region matches first, then recency
    (a.regions IS NOT NULL AND a.regions && ARRAY[p_user_region]::region_code[]) DESC,
    a.published_at DESC NULLS LAST,
    a.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: auto_create_user_region
--  Auto-create default region entry when user registers
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_create_user_region()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  default_region region_code := 'ke';  -- Default to Kenya
BEGIN
  -- Get user's default region from auth metadata or default to 'ke'
  IF NEW.region_preference IS NOT NULL THEN
    default_region := COALESCE(
      NEW.region_preference->>'default_region',
      'ke'
    )::region_code;
  END IF;

  -- Auto-create user region entry
  INSERT INTO public.user_regions (user_id, region_code, is_default, priority)
  VALUES (NEW.user_id, default_region, TRUE, 10)
  ON CONFLICT (user_id, region_code) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_create_user_region ON public.users;
CREATE TRIGGER trigger_auto_create_user_region
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION auto_create_user_region();

-- ─────────────────────────────────────────────────────────────
--  FUNCTION: auto_create_article_regions
--  Auto-create article regions from category regions if not set
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_create_article_regions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cat_regions region_code[];
  region region_code;
BEGIN
  -- Get category regions if available
  SELECT regions INTO cat_regions
  FROM public.categories WHERE category_id = NEW.category_id;

  -- If article has no regions set but category does, use category regions
  IF NEW.regions IS NULL OR NEW.regions = '{}' THEN
    IF cat_regions IS NOT NULL AND array_length(cat_regions, 1) > 0 THEN
      -- Insert article regions from category
      FOREACH region IN ARRAY cat_regions LOOP
        INSERT INTO public.article_regions (article_id, region_code, priority)
        VALUES (NEW.article_id, region, 5)
        ON CONFLICT (article_id, region_code) DO NOTHING;
      END LOOP;
    ELSE
      -- Default to global
      INSERT INTO public.article_regions (article_id, region_code, priority)
      VALUES (NEW.article_id, 'global', 1)
      ON CONFLICT (article_id, region_code) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_create_article_regions ON public.articles;
CREATE TRIGGER trigger_auto_create_article_regions
  AFTER INSERT ON public.articles
  FOR EACH ROW EXECUTE FUNCTION auto_create_article_regions();

-- ─────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY (RLS) for region tables
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_regions ENABLE ROW LEVEL SECURITY;

-- Regions: public read
CREATE POLICY "Regions are public" ON public.regions
  FOR SELECT USING (true);

-- User regions: users manage own, admins see all
CREATE POLICY "Users see own regions" ON public.user_regions
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_regions.user_id)
  );

CREATE POLICY "Users manage own regions" ON public.user_regions
  FOR ALL USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_regions.user_id)
  );

CREATE POLICY "Admins manage all regions" ON public.user_regions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Article regions: public read (articles are public), admins manage
CREATE POLICY "Article regions are public" ON public.article_regions
  FOR SELECT USING (true);

CREATE POLICY "Admins manage article regions" ON public.article_regions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────
--  REALTIME subscriptions for live updates
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.regions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_regions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.article_regions;

-- ============================================================
--  TABLE: messages
--  Direct messaging between readers and journalists
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  message_id    BIGSERIAL       PRIMARY KEY,
  sender_id     BIGINT          NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  receiver_id   BIGINT          NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  message       TEXT            NOT NULL,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  is_read       BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own messages" ON public.messages
  FOR SELECT USING (
    sender_id = (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
    OR receiver_id = (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users insert own messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
  );

-- Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================
--  SEED: Initial user regions (for existing users)
-- ============================================================
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT user_id FROM public.users LOOP
    INSERT INTO public.user_regions (user_id, region_code, is_default, priority)
    VALUES (user_record.user_id, 'ke', TRUE, 10)
    ON CONFLICT (user_id, region_code) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================
--  SEED: Article regions (for existing articles)
-- ============================================================
DO $$
DECLARE
  article_record RECORD;
  cat_regions region_code[];
BEGIN
  FOR article_record IN 
    SELECT article_id, category_id, regions FROM public.articles 
    WHERE regions IS NULL OR regions = '{}' 
  LOOP
    SELECT regions INTO cat_regions
    FROM public.categories WHERE category_id = article_record.category_id;

    IF cat_regions IS NOT NULL AND array_length(cat_regions, 1) > 0 THEN
      INSERT INTO public.article_regions (article_id, region_code, priority)
      SELECT article_record.article_id, unnest, 5
      FROM unnest(cat_regions)
      ON CONFLICT (article_id, region_code) DO NOTHING;
    ELSE
      INSERT INTO public.article_regions (article_id, region_code, priority)
      VALUES (article_record.article_id, 'global', 1)
      ON CONFLICT (article_id, region_code) DO NOTHING;
    END IF;
  END LOOP;
END $$;
