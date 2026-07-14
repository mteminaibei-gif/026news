CREATE OR REPLACE FUNCTION public.increment_article_views(p_article_id BIGINT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.articles SET views = COALESCE(views, 0) + 1 WHERE article_id = p_article_id;
  INSERT INTO public.analytics (article_id, views, likes, shares, comments_count)
  VALUES (p_article_id, 1, 0, 0, 0)
  ON CONFLICT (article_id) DO UPDATE SET
    views = public.analytics.views + 1,
    updated_at = NOW();
END;
$$;
