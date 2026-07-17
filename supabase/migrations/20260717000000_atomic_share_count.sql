-- Atomic increment for article share_count (prevents race conditions)
CREATE OR REPLACE FUNCTION public.increment_article_shares(row_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.articles
  SET share_count = COALESCE(share_count, 0) + 1
  WHERE article_id = row_id
  RETURNING share_count INTO new_count;

  RETURN new_count;
END;
$$;
