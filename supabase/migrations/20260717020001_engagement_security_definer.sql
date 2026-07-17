-- Re-create the engagement counter trigger functions with SECURITY DEFINER.
-- They write to public.articles / public.analytics which have RLS enabled, so when
-- invoked by a normal user session the INSERT/UPDATE is blocked (error 42501). Marking
-- them SECURITY DEFINER makes them run as the table owner, bypassing RLS — the same
-- pattern already used by update_like_count() and the notification triggers.

CREATE OR REPLACE FUNCTION public.update_article_like_count()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles SET like_count = like_count + 1 WHERE article_id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles SET like_count = GREATEST(like_count - 1, 0) WHERE article_id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_article_save_count()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles SET save_count = save_count + 1 WHERE article_id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles SET save_count = GREATEST(save_count - 1, 0) WHERE article_id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
