-- ============================================================
--  026News — Schema Reconciliation (types.ts full coverage)
--  Migration: 20260712_reconcile_schema
--  Idempotent: safe to re-run. Apply AFTER existing migrations,
--  before the seed migration (20260712_seed_demo).
--
--  Fixes:
--   - adds every table/column declared in lib/supabase/types.ts
--   - fixes saved_articles RLS (referenced non-existent user_email col)
--   - adds handle_new_user trigger so Supabase Auth signups create a
--     public.users row (required for RLS + ownership checks)
--   - adds engagement triggers (like_count / save_count / comments_count)
--   - adds views v_trending_articles, v_top_journalists
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE region_code AS ENUM
    ('ke','ng','za','gh','ug','tz','et','global');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE moderation_severity AS ENUM ('low','medium','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE moderation_status AS ENUM
    ('pending','reviewed','resolved','dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── users: add columns from types.ts ────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS
  region_preference JSONB DEFAULT NULL;   -- { default_region, preferred_regions[], region_priority{} }
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS
  follower_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS
  following_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS
  article_count INTEGER NOT NULL DEFAULT 0;

-- ── categories: region support ──────────────────────────────
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS
  region_targeted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS
  regions region_code[] DEFAULT '{}';

-- ── articles: engagement + region columns ───────────────────
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS
  like_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS
  share_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS
  save_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS
  reading_time_minutes INTEGER;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS
  regions region_code[] DEFAULT '{}';
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS
  is_region_priority BOOLEAN NOT NULL DEFAULT FALSE;

-- ── comments: like_count ────────────────────────────────────
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS
  like_count INTEGER NOT NULL DEFAULT 0;

-- ── rss_feeds: regions ──────────────────────────────────────
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS
  regions region_code[] DEFAULT '{}';

-- ── article_revenue: rename last_calculated -> last_updated ─
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='article_revenue'
      AND column_name='last_calculated'
  ) THEN
    ALTER TABLE public.article_revenue RENAME COLUMN last_calculated TO last_updated;
  END IF;
END $$;
ALTER TABLE public.article_revenue ADD COLUMN IF NOT EXISTS
  last_updated TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
--  NEW TABLES (declared in types.ts, absent from prior schema)
-- ============================================================

-- regions (reference table)
CREATE TABLE IF NOT EXISTS public.regions (
  region_id  BIGSERIAL PRIMARY KEY,
  code      region_code NOT NULL UNIQUE,
  name      TEXT NOT NULL,
  flag      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_regions
CREATE TABLE IF NOT EXISTS public.user_regions (
  user_region_id      BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  region_code         region_code NOT NULL,
  is_default          BOOLEAN NOT NULL DEFAULT FALSE,
  priority            INTEGER NOT NULL DEFAULT 0,
  preferred_categories INTEGER[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, region_code)
);

-- article_regions
CREATE TABLE IF NOT EXISTS public.article_regions (
  article_region_id BIGSERIAL PRIMARY KEY,
  article_id        BIGINT NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  region_code       region_code NOT NULL,
  priority          INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- messages (user-to-user)
CREATE TABLE IF NOT EXISTS public.messages (
  message_id  BIGSERIAL PRIMARY KEY,
  sender_id   BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  receiver_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE
);

-- audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  log_id      BIGSERIAL PRIMARY KEY,
  admin_id    BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   BIGINT,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- api_rate_limits
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  limit_id    BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES public.users(user_id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  ip_hash     TEXT,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- article_likes
CREATE TABLE IF NOT EXISTS public.article_likes (
  like_id    BIGSERIAL PRIMARY KEY,
  article_id BIGINT NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- user_follows
CREATE TABLE IF NOT EXISTS public.user_follows (
  follow_id    BIGSERIAL PRIMARY KEY,
  follower_id  BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  following_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- article_versions
CREATE TABLE IF NOT EXISTS public.article_versions (
  version_id     BIGSERIAL PRIMARY KEY,
  article_id     BIGINT NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  excerpt        TEXT,
  featured_image TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  status         article_status NOT NULL DEFAULT 'draft',
  change_summary TEXT,
  author_id      BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- article_tags
CREATE TABLE IF NOT EXISTS public.article_tags (
  tag_id      BIGSERIAL PRIMARY KEY,
  tag_name    TEXT NOT NULL,
  tag_slug    TEXT NOT NULL UNIQUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- article_tag_mappings
CREATE TABLE IF NOT EXISTS public.article_tag_mappings (
  mapping_id  BIGSERIAL PRIMARY KEY,
  article_id  BIGINT NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  tag_id      BIGINT NOT NULL REFERENCES public.article_tags(tag_id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, tag_id)
);

-- content_moderation
CREATE TABLE IF NOT EXISTS public.content_moderation (
  moderation_id BIGSERIAL PRIMARY KEY,
  content_type  TEXT NOT NULL,
  content_id    BIGINT NOT NULL,
  flagged_by    BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
  reason        TEXT,
  severity      moderation_severity NOT NULL DEFAULT 'low',
  status        moderation_status NOT NULL DEFAULT 'pending',
  admin_notes   TEXT,
  resolved_by   BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  template_id  BIGSERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_slug TEXT NOT NULL UNIQUE,
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  variables    TEXT[] DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── indexes for new tables ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_regions_user   ON public.user_regions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_regions_art ON public.article_regions(article_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver   ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender     ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_art   ON public.article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follow ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_art ON public.article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tag_maps_art ON public.article_tag_mappings(article_id);
CREATE INDEX IF NOT EXISTS idx_content_mod_status  ON public.content_moderation(status);

-- ============================================================
--  FUNCTIONS
-- ============================================================

-- handle_new_user: auto-create public.users row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta JSONB;
  v_name TEXT;
  v_role user_role;
BEGIN
  v_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_name := COALESCE(NULLIF(TRIM(v_meta->>'name'), ''), SPLIT_PART(NEW.email, '@', 1));
  v_role := COALESCE((v_meta->>'role')::user_role, 'reader');
  INSERT INTO public.users (auth_id, name, email, role, password_hash, status)
  VALUES (NEW.id, v_name, NEW.email, v_role, '', 'active')
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- engagement: article like_count
CREATE OR REPLACE FUNCTION public.update_article_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles SET like_count = like_count + 1 WHERE article_id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles SET like_count = GREATEST(like_count - 1, 0) WHERE article_id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_article_like_count ON public.article_likes;
CREATE TRIGGER trg_article_like_count
  AFTER INSERT OR DELETE ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_article_like_count();

-- engagement: article save_count
CREATE OR REPLACE FUNCTION public.update_article_save_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles SET save_count = save_count + 1 WHERE article_id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles SET save_count = GREATEST(save_count - 1, 0) WHERE article_id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_article_save_count ON public.saved_articles;
CREATE TRIGGER trg_article_save_count
  AFTER INSERT OR DELETE ON public.saved_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_article_save_count();

-- engagement: analytics.comments_count
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.analytics (article_id, comments_count)
    VALUES (NEW.article_id, 1)
    ON CONFLICT (article_id)
    DO UPDATE SET comments_count = public.analytics.comments_count + 1, updated_at = NOW();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.analytics
    SET comments_count = GREATEST(comments_count - 1, 0), updated_at = NOW()
    WHERE article_id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_count ON public.comments;
CREATE TRIGGER trg_comment_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();

-- updated_at helper for new tables
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS user_regions_updated_at ON public.user_regions;
CREATE TRIGGER user_regions_updated_at
  BEFORE UPDATE ON public.user_regions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS article_tags_updated_at ON public.article_tags;
CREATE TRIGGER article_tags_updated_at
  BEFORE UPDATE ON public.article_tags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS content_mod_updated_at ON public.content_moderation;
CREATE TRIGGER content_mod_updated_at
  BEFORE UPDATE ON public.content_moderation FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS email_templates_updated_at ON public.email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
--  ROW LEVEL SECURITY — enable on new tables + fix saved_articles
-- ============================================================

ALTER TABLE public.regions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_regions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_regions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tag_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates    ENABLE ROW LEVEL SECURITY;

-- ── saved_articles: FIX broken policies (user_email did not exist) ──
DROP POLICY IF EXISTS "Users can view their own saved articles" ON public.saved_articles;
DROP POLICY IF EXISTS "Users can save articles"                ON public.saved_articles;
DROP POLICY IF EXISTS "Users can remove saved articles"        ON public.saved_articles;

CREATE POLICY "Users can view their own saved articles"
  ON public.saved_articles FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id));

CREATE POLICY "Users can save articles"
  ON public.saved_articles FOR INSERT
  WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id));

CREATE POLICY "Users can remove saved articles"
  ON public.saved_articles FOR DELETE
  USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id));

-- ── regions: public read ──
DROP POLICY IF EXISTS "Regions are public" ON public.regions;
CREATE POLICY "Regions are public" ON public.regions FOR SELECT USING (true);

-- ── article_regions: public read ──
DROP POLICY IF EXISTS "Article regions are public" ON public.article_regions;
CREATE POLICY "Article regions are public" ON public.article_regions FOR SELECT USING (true);

-- ── user_regions: owner manages ──
DROP POLICY IF EXISTS "Users manage own region prefs" ON public.user_regions;
CREATE POLICY "Users manage own region prefs" ON public.user_regions
  FOR ALL
  USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = user_regions.user_id))
  WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = user_regions.user_id));

-- ── article_likes: public read; authenticated insert own ──
DROP POLICY IF EXISTS "Likes are public" ON public.article_likes;
CREATE POLICY "Likes are public" ON public.article_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users like as themselves" ON public.article_likes;
CREATE POLICY "Users like as themselves" ON public.article_likes
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = article_likes.user_id));

-- ── user_follows: public read; authenticated follow/unfollow ──
DROP POLICY IF EXISTS "Follows are public" ON public.user_follows;
CREATE POLICY "Follows are public" ON public.user_follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users follow as themselves" ON public.user_follows;
CREATE POLICY "Users follow as themselves" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = user_follows.follower_id));
DROP POLICY IF EXISTS "Users unfollow own" ON public.user_follows;
CREATE POLICY "Users unfollow own" ON public.user_follows
  FOR DELETE USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = user_follows.follower_id));

-- ── messages: sender/receiver only ──
DROP POLICY IF EXISTS "Users see own messages" ON public.messages;
CREATE POLICY "Users see own messages" ON public.messages
  FOR SELECT USING (
    auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = messages.sender_id)
    OR auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = messages.receiver_id)
  );
DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = messages.sender_id));

-- ── article_tags / mappings: public read; admin manage ──
DROP POLICY IF EXISTS "Tags are public" ON public.article_tags;
CREATE POLICY "Tags are public" ON public.article_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage tags" ON public.article_tags;
CREATE POLICY "Admins manage tags" ON public.article_tags
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Tag mappings are public" ON public.article_tag_mappings;
CREATE POLICY "Tag mappings are public" ON public.article_tag_mappings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage tag mappings" ON public.article_tag_mappings;
CREATE POLICY "Admins manage tag mappings" ON public.article_tag_mappings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- ── article_versions: author/admin ──
DROP POLICY IF EXISTS "Version authors manage" ON public.article_versions;
CREATE POLICY "Version authors manage" ON public.article_versions
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = article_versions.author_id));
DROP POLICY IF EXISTS "Admins manage versions" ON public.article_versions;
CREATE POLICY "Admins manage versions" ON public.article_versions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- ── content_moderation: admin manage; journalists see own flagged ──
DROP POLICY IF EXISTS "Admins manage moderation" ON public.content_moderation;
CREATE POLICY "Admins manage moderation" ON public.content_moderation
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Journalists see own flagged" ON public.content_moderation;
CREATE POLICY "Journalists see own flagged" ON public.content_moderation
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role = 'journalist'
        AND user_id = content_moderation.flagged_by
    )
  );

-- ── email_templates: admin manage; public read active ──
DROP POLICY IF EXISTS "Admins manage email templates" ON public.email_templates;
CREATE POLICY "Admins manage email templates" ON public.email_templates
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Email templates readable" ON public.email_templates;
CREATE POLICY "Email templates readable" ON public.email_templates FOR SELECT USING (true);

-- ── audit_log / api_rate_limits: admin only ──
DROP POLICY IF EXISTS "Admins read audit log" ON public.audit_log;
CREATE POLICY "Admins read audit log" ON public.audit_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins read rate limits" ON public.api_rate_limits;
CREATE POLICY "Admins read rate limits" ON public.api_rate_limits
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- ── grants (so anon/authenticated roles can attempt queries) ──
GRANT SELECT ON public.regions, public.article_regions, public.article_tags,
            public.article_tag_mappings, public.email_templates TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_regions, public.user_follows,
      public.article_likes, public.messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_articles TO authenticated;

-- ============================================================
--  VIEWS
-- ============================================================

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

-- ============================================================
--  REALTIME — add new tables
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT unnest(ARRAY[
    'public.messages','public.article_likes','public.user_follows',
    'public.saved_articles','public.content_moderation'
  ]) AS t
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', r.t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
