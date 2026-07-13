-- ── Likes: real, persistent, login-gated ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.likes (
  like_id    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_id integer NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  user_id    integer NOT NULL REFERENCES public.users(user_id)        ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_public_select" ON public.likes;
DROP POLICY IF EXISTS "likes_auth_insert" ON public.likes;
DROP POLICY IF EXISTS "likes_auth_delete" ON public.likes;

CREATE POLICY "likes_public_select" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_auth_insert"  ON public.likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "likes_auth_delete"  ON public.likes FOR DELETE  USING (auth.uid() IS NOT NULL);

-- Keep articles.like_count in sync with the likes table.
CREATE OR REPLACE FUNCTION public.update_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.articles
       SET like_count = COALESCE(like_count, 0) + 1
     WHERE article_id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.articles
       SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0)
     WHERE article_id = OLD.article_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_like_count ON public.likes;
CREATE TRIGGER trg_like_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_like_count();

-- ── More categories ───────────────────────────────────────────────────────────
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Kenya',          'kenya',          'News from across Kenya',              false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'kenya');
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Africa',         'africa',         'African continent news and analysis', false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'africa');
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Health',         'health',         'Health, wellness and medical news',   false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'health');
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Education',      'education',      'Education, schools and campuses',     false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'education');
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Agriculture',    'agriculture',    'Farming, agribusiness and food',      false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'agriculture');
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Lifestyle',      'lifestyle',      'Lifestyle, culture and living',       false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'lifestyle');
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Opinion',        'opinion',        'Opinions, editorials and analysis',   false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'opinion');
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Crime & Justice','crime-justice',  'Crime, courts and justice',           false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'crime-justice');
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Environment',    'environment',    'Climate, weather and the environment',false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'environment');
INSERT INTO public.categories (name, slug, description, region_targeted, regions)
SELECT 'Real Estate',    'real-estate',    'Property, housing and real estate',   false, '{}'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'real-estate');

-- ── Tag untagged published posts (category_id IS NULL) ─────────────────────────
-- Each pass only touches rows still missing a category, so ordering runs from
-- specific to general and the final pass drops everything left into "World".

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Kenya')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'kenya|uhuru|raila|ruto|nairobi|kisumu|mombasa|kikuyu|luo|kalenjin|tana|nakuru|eldoret';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Africa')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'africa|uganda|tanzania|ethiopia|rwanda|sudan|somalia|nigeria|ghana|egypt|south africa';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Politics')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'government|election|parliament|minister|president|senate|bill|policy|vote|campaign|mp |mp|cabinet';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Business')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'economy|market|inflation|business|company|stock|trade|startup|investor|bank|fund|shilling';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Tech')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'tech|software| ai |app|internet|digital|cyber|data |robot|cloud|chip';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Science')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'space|science|research|study|scientist|physics|universe|quantum';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Health')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'health|covid|vaccine|hospital|disease|medical|virus|patient|doctor|ebola|mental|nhif';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Sports')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'football|premier league|world cup|match|sport|olympic|player|coach|championship|rugby|athletics';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Entertainment')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'movie|film|music|celebrity|actor|album|hollywood|tv |show|broadcast|gospel';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Crime & Justice')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'crime|police|court|murder|arrest|trial|prison|sentence|fraud|kidnap|terror|detective';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Environment')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'climate|environment|weather|flood|drought|wildfire|emission|carbon|green|forest';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Education')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'school|university|student|education|exam|teacher|classroom|lecturer|campus';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Agriculture')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'farm|agriculture|crop|livestock|cattle|harvest|farmer|tea |coffee';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Real Estate')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'house|property|real estate|rent|land|mortgage|housing|apartment';

UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'Opinion')
 WHERE category_id IS NULL
   AND lower(coalesce(title,'') || ' ' || coalesce(content,'')) ~ 'opinion|editorial|commentary|viewpoint|perspective|why i ';

-- Anything still untagged becomes "World".
UPDATE public.articles
   SET category_id = (SELECT category_id FROM public.categories WHERE name = 'World')
 WHERE category_id IS NULL;
