-- ============================================================
--  Migration: Schema Enhancements & Bug Fixes
--  Date: 2024-07-11
--  Purpose: Fix RLS bugs, add missing tables, enhance schema
-- ============================================================

-- ============================================================
--  PART 1: Fix saved_articles RLS Policy Bug (if table exists)
-- ============================================================

-- Only fix RLS policies if saved_articles table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_articles') THEN
    -- Drop broken RLS policies
    DROP POLICY IF EXISTS "Users can view their own saved articles" ON public.saved_articles;
    DROP POLICY IF EXISTS "Users can save articles" ON public.saved_articles;
    DROP POLICY IF EXISTS "Users can remove saved articles" ON public.saved_articles;

    -- Create corrected RLS policies using auth_id instead of nonexistent user_email
    CREATE POLICY "Users can view their own saved articles"
      ON public.saved_articles
      FOR SELECT
      USING (
        auth.uid() = (
          SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id
        )
      );

    CREATE POLICY "Users can save articles"
      ON public.saved_articles
      FOR INSERT
      WITH CHECK (
        auth.uid() = (
          SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id
        )
      );

    CREATE POLICY "Users can remove saved articles"
      ON public.saved_articles
      FOR DELETE
      USING (
        auth.uid() = (
          SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id
        )
      );
  END IF;
END $$;

-- ============================================================
--  PART 2: Add Missing Tables
-- ============================================================

-- ─────────────────────────────────────────────────────────────
--  TABLE: audit_log
--  Track all admin actions for compliance and debugging
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  log_id          BIGSERIAL       PRIMARY KEY,
  admin_id        BIGINT          NOT NULL REFERENCES public.users(user_id) ON DELETE SET NULL,
  action          TEXT            NOT NULL,
  table_name      TEXT            NOT NULL,
  record_id       BIGINT,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins view audit logs" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────
--  TABLE: api_rate_limits
--  Track and enforce API rate limiting per user/IP
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  limit_id        BIGSERIAL       PRIMARY KEY,
  user_id         BIGINT          REFERENCES public.users(user_id) ON DELETE CASCADE,
  endpoint        TEXT            NOT NULL,
  ip_hash         TEXT,
  request_count   INT             NOT NULL DEFAULT 0,
  window_start    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  window_end      TIMESTAMPTZ     NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint, window_start),
  UNIQUE(ip_hash, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON public.api_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.api_rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.api_rate_limits(window_end DESC);

-- Auto-cleanup expired rate limit records (daily)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM public.api_rate_limits
  WHERE window_end < NOW();
$$;

-- ─────────────────────────────────────────────────────────────
--  TABLE: article_likes
--  Track individual article likes (granular engagement)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_likes (
  like_id         BIGSERIAL       PRIMARY KEY,
  article_id      BIGINT          NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  user_id         BIGINT          NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_article_likes_article ON public.article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user ON public.article_likes(user_id);

-- Enable RLS
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

-- Public read (everyone can see who liked)
CREATE POLICY "Article likes are public" ON public.article_likes
  FOR SELECT USING (true);

-- Authenticated users can like articles
CREATE POLICY "Users can like articles" ON public.article_likes
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = article_likes.user_id)
  );

-- Users can unlike their own likes
CREATE POLICY "Users can unlike articles" ON public.article_likes
  FOR DELETE USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = article_likes.user_id)
  );

-- ─────────────────────────────────────────────────────────────
--  TABLE: user_follows
--  Track journalist/reader relationships (followers/following)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_follows (
  follow_id       BIGSERIAL       PRIMARY KEY,
  follower_id     BIGINT          NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  following_id    BIGINT          NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.user_follows(following_id);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Public read (everyone can see who follows whom)
CREATE POLICY "Follows are public" ON public.user_follows
  FOR SELECT USING (true);

-- Authenticated users can follow/unfollow
CREATE POLICY "Users can follow" ON public.user_follows
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_follows.follower_id)
  );

CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE USING (
    auth.uid() IN (SELECT auth_id FROM public.users WHERE user_id = user_follows.follower_id)
  );

-- ─────────────────────────────────────────────────────────────
--  TABLE: article_versions
--  Track article revision history (drafts and published versions)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_versions (
  version_id      BIGSERIAL       PRIMARY KEY,
  article_id      BIGINT          NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  title           TEXT            NOT NULL,
  content         TEXT            NOT NULL,
  excerpt         TEXT,
  featured_image  TEXT,
  version_number  INT             NOT NULL,
  status          TEXT            NOT NULL DEFAULT 'draft',
  change_summary  TEXT,
  author_id       BIGINT          REFERENCES public.users(user_id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_article_versions_article ON public.article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_created ON public.article_versions(created_at DESC);

-- Enable RLS
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;

-- Authors and admins can view versions
CREATE POLICY "Authors view own article versions" ON public.article_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.article_id = article_versions.article_id
      AND (
        a.author_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
--  TABLE: article_tags
--  Proper tagging system with tag statistics
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_tags (
  tag_id          BIGSERIAL       PRIMARY KEY,
  tag_name        TEXT            NOT NULL UNIQUE,
  tag_slug        TEXT            NOT NULL UNIQUE,
  usage_count     BIGINT          NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON public.article_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.article_tags(tag_slug);

-- ─────────────────────────────────────────────────────────────
--  TABLE: article_tag_mappings
--  Map articles to tags (many-to-many)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_tag_mappings (
  mapping_id      BIGSERIAL       PRIMARY KEY,
  article_id      BIGINT          NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  tag_id          BIGINT          NOT NULL REFERENCES public.article_tags(tag_id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_mappings_article ON public.article_tag_mappings(article_id);
CREATE INDEX IF NOT EXISTS idx_mappings_tag ON public.article_tag_mappings(tag_id);

-- ─────────────────────────────────────────────────────────────
--  TABLE: content_moderation
--  Track flagged content and moderation actions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_moderation (
  moderation_id   BIGSERIAL       PRIMARY KEY,
  content_type    TEXT            NOT NULL,  -- 'article', 'comment', 'message'
  content_id      BIGINT          NOT NULL,
  flagged_by      BIGINT          REFERENCES public.users(user_id) ON DELETE SET NULL,
  reason          TEXT            NOT NULL,
  severity        TEXT            NOT NULL DEFAULT 'low',  -- low, medium, high, critical
  status          TEXT            NOT NULL DEFAULT 'pending',  -- pending, reviewed, resolved, dismissed
  admin_notes     TEXT,
  resolved_by     BIGINT          REFERENCES public.users(user_id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_type ON public.content_moderation(content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_status ON public.content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_moderation_severity ON public.content_moderation(severity);

-- Enable RLS
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation queue
CREATE POLICY "Admins view moderation" ON public.content_moderation
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────
--  TABLE: email_templates
--  Store configurable email templates for notifications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_templates (
  template_id     BIGSERIAL       PRIMARY KEY,
  template_name   TEXT            NOT NULL UNIQUE,
  template_slug   TEXT            NOT NULL UNIQUE,
  subject         TEXT            NOT NULL,
  body            TEXT            NOT NULL,
  variables       TEXT[] DEFAULT '{}',  -- {{{author}}, {{article_title}}}
  is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
--  PART 3: Add Missing Columns to Existing Tables
-- ============================================================

-- Add to users table for social engagement
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS follower_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS following_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS article_count BIGINT NOT NULL DEFAULT 0;

-- Add to articles table for engagement tracking
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS like_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS share_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS save_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS reading_time_minutes INT DEFAULT NULL;

-- Add to comments for engagement
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS like_count BIGINT NOT NULL DEFAULT 0;

-- ============================================================
--  PART 4: Create Helper Functions
-- ============================================================

-- Function to increment article like count
CREATE OR REPLACE FUNCTION public.increment_article_likes(p_article_id BIGINT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.articles SET like_count = like_count + 1 WHERE article_id = p_article_id;
END;
$$;

-- Function to decrement article like count
CREATE OR REPLACE FUNCTION public.decrement_article_likes(p_article_id BIGINT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.articles SET like_count = GREATEST(0, like_count - 1) WHERE article_id = p_article_id;
END;
$$;

-- Function to update user follower counts
CREATE OR REPLACE FUNCTION public.update_user_follow_counts(p_user_id BIGINT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users SET
    follower_count = (SELECT COUNT(*) FROM public.user_follows WHERE following_id = p_user_id),
    following_count = (SELECT COUNT(*) FROM public.user_follows WHERE follower_id = p_user_id)
  WHERE user_id = p_user_id;
END;
$$;

-- Function to create article version on save
CREATE OR REPLACE FUNCTION public.create_article_version(
  p_article_id BIGINT,
  p_change_summary TEXT DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_version_number INT;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
  FROM public.article_versions WHERE article_id = p_article_id;
  
  INSERT INTO public.article_versions (
    article_id, title, content, excerpt, featured_image,
    version_number, status, change_summary, author_id
  )
  SELECT
    a.article_id, a.title, a.content, a.excerpt, a.featured_image,
    v_version_number, a.status, p_change_summary, a.author_id
  FROM public.articles a
  WHERE a.article_id = p_article_id;
END;
$$;

-- ============================================================
--  PART 5: Add Triggers for Automatic Updates
-- ============================================================

-- Trigger to auto-create version when article is updated
CREATE OR REPLACE FUNCTION public.trigger_article_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.title != OLD.title OR NEW.content != OLD.content OR NEW.status != OLD.status THEN
    PERFORM public.create_article_version(NEW.article_id, 'Auto-saved');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_article_version ON public.articles;
CREATE TRIGGER trg_article_version
  AFTER UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION trigger_article_version();

-- Trigger to update like count when like is added/removed
CREATE OR REPLACE FUNCTION public.trigger_article_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.increment_article_likes(NEW.article_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.decrement_article_likes(OLD.article_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_article_like_count ON public.article_likes;
CREATE TRIGGER trg_article_like_count
  AFTER INSERT OR DELETE ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION trigger_article_like_count();

-- Trigger to update follow counts
CREATE OR REPLACE FUNCTION public.trigger_follow_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_user_follow_counts(NEW.following_id);
    PERFORM public.update_user_follow_counts(NEW.follower_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_user_follow_counts(OLD.following_id);
    PERFORM public.update_user_follow_counts(OLD.follower_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_follow_count ON public.user_follows;
CREATE TRIGGER trg_follow_count
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION trigger_follow_count();

-- ============================================================
--  PART 6: Create Useful Views
-- ============================================================

-- View for trending articles
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
  u.name AS author_name,
  c.name AS category_name,
  a.created_at,
  -- Engagement score: weighted combination of interactions
  (a.views * 0.1 + a.like_count * 1 + a.share_count * 2 + a.save_count * 1.5) AS engagement_score
FROM public.articles a
LEFT JOIN public.users u ON u.user_id = a.author_id
LEFT JOIN public.categories c ON c.category_id = a.category_id
WHERE a.status = 'published'
ORDER BY engagement_score DESC;

-- View for top journalists by followers
CREATE OR REPLACE VIEW public.v_top_journalists AS
SELECT
  u.user_id,
  u.name,
  u.profile_image,
  u.bio,
  u.follower_count,
  u.article_count,
  u.total_views,
  COUNT(DISTINCT a.article_id) AS published_count,
  COALESCE(SUM(a.like_count), 0) AS total_likes
FROM public.users u
LEFT JOIN public.articles a ON a.author_id = u.user_id AND a.status = 'published'
WHERE u.role = 'journalist'
GROUP BY u.user_id, u.name, u.profile_image, u.bio, u.follower_count, u.article_count, u.total_views
ORDER BY u.follower_count DESC, u.total_views DESC;

-- ============================================================
--  PART 7: Enable Realtime for New Tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.article_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.article_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_moderation;

-- ============================================================
--  Migration Complete
-- ============================================================
-- Summary of changes:
-- 1. Fixed saved_articles RLS policies (bug fix)
-- 2. Added audit_log table for admin action tracking
-- 3. Added api_rate_limits table for API throttling
-- 4. Added article_likes table for granular engagement
-- 5. Added user_follows table for social relationships
-- 6. Added article_versions table for revision history
-- 7. Added article_tags and article_tag_mappings for proper tagging
-- 8. Added content_moderation table for moderation workflows
-- 9. Added email_templates table for configurable emails
-- 10. Added engagement columns to users and articles tables
-- 11. Created helper functions for engagement tracking
-- 12. Added automatic triggers for maintaining denormalized counts
-- 13. Created views for trending content and top journalists
