-- ============================================================
--  026News — Ensure core article columns exist (20260712_articles_ensure)
--  Runs BEFORE the seed migration. The live DB predates schema.sql and is
--  missing several core columns (slug, title, content, status, ...), so we
--  add them idempotently here. Also recreates the engagement views.
-- ============================================================

-- ── articles: guarantee all expected columns exist ───────────
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS category_id BIGINT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS author_id BIGINT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS status article_status;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS monetization_type monetization_type;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS featured_image TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS likes BIGINT DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS earnings NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_aggregated BOOLEAN DEFAULT FALSE;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS regions region_code[] DEFAULT '{}';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS is_region_priority BOOLEAN DEFAULT FALSE;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── recreate engagement views (idempotent) ───────────────────
CREATE OR REPLACE VIEW public.v_trending_articles AS
SELECT
  a.article_id,
  a.title,
  a.slug,
  a.excerpt,
  a.featured_image,
  a.views,
  a.like_count,
  a.share_count,
  a.save_count,
  u.name      AS author_name,
  c.name      AS category_name,
  a.created_at,
  (a.views * 1 + a.like_count * 3 + a.share_count * 2 + a.save_count * 4)::numeric
              AS engagement_score
FROM public.articles a
LEFT JOIN public.users      u ON u.user_id = a.author_id
LEFT JOIN public.categories c ON c.category_id = a.category_id
WHERE a.status = 'published';

CREATE OR REPLACE VIEW public.v_top_journalists AS
SELECT
  u.user_id,
  u.name,
  u.profile_image,
  u.bio,
  u.follower_count,
  u.article_count,
  COUNT(a.article_id) FILTER (WHERE a.status = 'published') AS published_count,
  COALESCE(SUM(a.likes), 0) AS total_likes
FROM public.users u
LEFT JOIN public.articles a ON a.author_id = u.user_id
WHERE u.role = 'journalist'
GROUP BY u.user_id, u.name, u.profile_image, u.bio, u.follower_count, u.article_count;
