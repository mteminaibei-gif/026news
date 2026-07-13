-- Fix SECURITY DEFINER views to use SECURITY INVOKER so RLS on underlying
-- tables is respected. Without this, views owned by the superuser bypass
-- row-level security and may expose data the querying user shouldn't see.

CREATE OR REPLACE VIEW public.v_top_journalists WITH (security_invoker = true)
AS
SELECT u.user_id,
       u.name,
       u.profile_image,
       u.bio,
       u.follower_count,
       u.article_count,
       count(a.article_id) FILTER (WHERE a.status = 'published') AS published_count,
       COALESCE(sum(a.likes), 0::numeric) AS total_likes
FROM public.users u
  LEFT JOIN public.articles a ON a.author_id = u.user_id
WHERE u.role = 'journalist'
GROUP BY u.user_id, u.name, u.profile_image, u.bio, u.follower_count, u.article_count;

CREATE OR REPLACE VIEW public.v_trending_articles WITH (security_invoker = true)
AS
SELECT a.article_id,
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
       (a.views * 1 + a.like_count * 3 + a.share_count * 2 + a.save_count * 4)::numeric AS engagement_score
FROM public.articles a
  LEFT JOIN public.users u ON u.user_id = a.author_id
  LEFT JOIN public.categories c ON c.category_id = a.category_id
WHERE a.status = 'published';
