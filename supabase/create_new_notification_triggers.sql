-- ============================================================
-- New notification triggers: likes, follows, article_published
-- Run against live DB: npx supabase db query --linked --file supabase/create_new_notification_triggers.sql
-- ============================================================

-- ── 1. Article Like notification ──────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_article_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_author BIGINT;
  v_title  TEXT;
  v_slug   TEXT;
  v_liker  TEXT;
BEGIN
  SELECT author_id, title, slug INTO v_author, v_title, v_slug
  FROM public.articles WHERE article_id = NEW.article_id;
  IF v_author IS NULL OR v_author = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(name, 'Someone') INTO v_liker
  FROM public.users WHERE user_id = NEW.user_id;
  PERFORM public.notify_user(
    v_author, 'Article liked',
    v_liker || ' liked "' || v_title || '"',
    'article_like', '/article/' || v_slug
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_article_like ON public.article_likes;
CREATE TRIGGER on_article_like
  AFTER INSERT ON public.article_likes
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_article_like();


-- ── 2. Follow notification ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_follower_name TEXT;
BEGIN
  SELECT COALESCE(name, 'Someone') INTO v_follower_name
  FROM public.users WHERE user_id = NEW.follower_id;
  PERFORM public.notify_user(
    NEW.following_id, 'New follower',
    v_follower_name || ' started following you',
    'follow', NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_follow ON public.user_follows;
CREATE TRIGGER on_user_follow
  AFTER INSERT ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_follow();


-- ── 3. Article Published notification ─────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_article_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_author_name TEXT;
  v_follower    RECORD;
BEGIN
  IF NEW.status <> 'published' THEN RETURN NEW; END IF;
  IF OLD IS NOT NULL AND OLD.status = 'published' THEN RETURN NEW; END IF;
  IF NEW.is_aggregated = TRUE THEN RETURN NEW; END IF;
  SELECT COALESCE(name, 'Someone') INTO v_author_name
  FROM public.users WHERE user_id = NEW.author_id;
  FOR v_follower IN
    SELECT follower_id FROM public.user_follows WHERE following_id = NEW.author_id
  LOOP
    PERFORM public.notify_user(
      v_follower.follower_id, 'Article published',
      v_author_name || ' published "' || NEW.title || '"',
      'article_published', '/article/' || NEW.slug
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_article_published ON public.articles;
CREATE TRIGGER on_article_published
  AFTER UPDATE OF status ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_article_published();


-- ── 4. Comment Reply notification ─────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_comment_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parent_author BIGINT;
  v_article_slug  TEXT;
  v_replier_name  TEXT;
BEGIN
  IF NEW.parent_comment_id IS NULL THEN RETURN NEW; END IF;
  SELECT c.user_id, a.slug INTO v_parent_author, v_article_slug
  FROM public.comments c
  JOIN public.articles a ON a.article_id = c.article_id
  WHERE c.comment_id = NEW.parent_comment_id;
  IF v_parent_author IS NULL OR v_parent_author = NEW.user_id THEN RETURN NEW; END IF;
  SELECT COALESCE(name, 'Someone') INTO v_replier_name
  FROM public.users WHERE user_id = NEW.user_id;
  PERFORM public.notify_user(
    v_parent_author, 'Comment reply',
    v_replier_name || ' replied to your comment',
    'new_comment', '/article/' || COALESCE(v_article_slug, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_reply ON public.comments;
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_comment_reply();
