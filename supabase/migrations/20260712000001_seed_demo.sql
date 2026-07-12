-- ============================================================
--  026News — Demo Seed (20260712_seed_demo)
--  Apply AFTER 20260712_reconcile_schema.
--  Idempotent: safe to re-run.
--
--  Creates 3 demo accounts with working logins:
--    admin@026newsblog.com      / Password123!   (admin)
--    journalist@026newsblog.com / Password123!   (journalist)
--    reader@026newsblog.com     / Password123!   (reader)
--  Plus regions, sample published articles, a comment and a saved article
--  so the app is previewable immediately.
-- ============================================================

-- Required for crypt()/gen_salt() used below
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure users.auth_id is unique (best-effort; live may already have it or may
-- have duplicates). handle_new_user() below no longer relies on it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.users'::regclass AND conname = 'users_auth_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.users ADD CONSTRAINT users_auth_id_key UNIQUE (auth_id);
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;
END $$;

-- The pre-existing region triggers (trigger_auto_create_article_regions /
-- trigger_auto_create_user_region) do ON CONFLICT (article_id, region_code) and
-- ON CONFLICT (user_id, region_code). Ensure those unique constraints exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.article_regions'::regclass
      AND conname = 'article_regions_article_id_region_code_key'
  ) THEN
    BEGIN
      ALTER TABLE public.article_regions
        ADD CONSTRAINT article_regions_article_id_region_code_key UNIQUE (article_id, region_code);
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_regions'::regclass
      AND conname = 'user_regions_user_id_region_code_key'
  ) THEN
    BEGIN
      ALTER TABLE public.user_regions
        ADD CONSTRAINT user_regions_user_id_region_code_key UNIQUE (user_id, region_code);
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
  -- analytics.article_id must be unique for the comment-count trigger's
  -- ON CONFLICT (article_id).
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.analytics'::regclass
      AND conname = 'analytics_article_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.analytics ADD CONSTRAINT analytics_article_id_key UNIQUE (article_id);
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END $$;

-- Recreate handle_new_user without ON CONFLICT (works whether or not auth_id is
-- unique on the live table).
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
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_id = NEW.id) THEN
    INSERT INTO public.users (auth_id, name, email, role, password_hash, status)
    VALUES (NEW.id, v_name, NEW.email, v_role, '', 'active');
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the pre-existing region triggers WITHOUT ON CONFLICT (they were
-- created by region_prioritization and rely on unique constraints that may be
-- missing on the live table). Use WHERE NOT EXISTS instead.
CREATE OR REPLACE FUNCTION public.auto_create_user_region()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  default_region region_code := 'ke';
BEGIN
  IF NEW.region_preference IS NOT NULL THEN
    default_region := COALESCE(NEW.region_preference->>'default_region','ke')::region_code;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.user_regions WHERE user_id = NEW.user_id AND region_code = default_region
  ) THEN
    INSERT INTO public.user_regions (user_id, region_code, is_default, priority)
    VALUES (NEW.user_id, default_region, TRUE, 10);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_auto_create_user_region ON public.users;
CREATE TRIGGER trigger_auto_create_user_region
  AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION auto_create_user_region();

CREATE OR REPLACE FUNCTION public.auto_create_article_regions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cat_regions region_code[];
  region region_code;
BEGIN
  SELECT regions INTO cat_regions FROM public.categories WHERE category_id = NEW.category_id;
  IF NEW.regions IS NULL OR NEW.regions = '{}' THEN
    IF cat_regions IS NOT NULL AND array_length(cat_regions, 1) > 0 THEN
      FOREACH region IN ARRAY cat_regions LOOP
        IF NOT EXISTS (
          SELECT 1 FROM public.article_regions WHERE article_id = NEW.article_id AND region_code = region
        ) THEN
          INSERT INTO public.article_regions (article_id, region_code, priority)
          VALUES (NEW.article_id, region, 5);
        END IF;
      END LOOP;
    ELSE
      IF NOT EXISTS (
        SELECT 1 FROM public.article_regions WHERE article_id = NEW.article_id AND region_code = 'global'
      ) THEN
        INSERT INTO public.article_regions (article_id, region_code, priority)
        VALUES (NEW.article_id, 'global', 1);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_auto_create_article_regions ON public.articles;
CREATE TRIGGER trigger_auto_create_article_regions
  AFTER INSERT ON public.articles FOR EACH ROW EXECUTE FUNCTION auto_create_article_regions();

-- ── REGIONS ─────────────────────────────────────────────────
INSERT INTO public.regions (code, name, flag)
SELECT v.code::region_code, v.name, v.flag FROM (VALUES
  ('ke',      'Kenya',          '🇰🇪'),
  ('ng',      'Nigeria',        '🇳🇬'),
  ('za',      'South Africa',   '🇿🇦'),
  ('gh',      'Ghana',          '🇬🇭'),
  ('ug',      'Uganda',         '🇺🇬'),
  ('tz',      'Tanzania',       '🇹🇿'),
  ('et',      'Ethiopia',       '🇪🇹'),
  ('global',  'Global',         '🌍')
) AS v(code, name, flag)
WHERE NOT EXISTS (SELECT 1 FROM public.regions r WHERE r.code = v.code::region_code);

-- ── CATEGORIES ──────────────────────────────────────────────
-- The live categories table predates schema.sql (no slug column) and may
-- lack the categories the demo articles reference. Ensure slug exists and
-- seed the categories we need.
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
DO $$
DECLARE
  _c RECORD;
BEGIN
  FOR _c IN SELECT * FROM (VALUES
    ('Politics',      'politics',      'Political news and analysis'),
    ('Business',      'business',      'Business and finance news'),
    ('Tech',          'tech',          'Technology and innovation'),
    ('Science',       'science',       'Science and research'),
    ('Entertainment', 'entertainment', 'Entertainment and culture'),
    ('Sports',        'sports',        'Sports news and results'),
    ('World',         'world',         'World news')
  ) AS t(name, slug, description)
  LOOP
    UPDATE public.categories SET slug = _c.slug, description = _c.description WHERE name = _c.name;
    IF NOT FOUND THEN
      INSERT INTO public.categories (name, slug, description) VALUES (_c.name, _c.slug, _c.description);
    END IF;
  END LOOP;
END $$;

-- ── DEMO ACCOUNTS ───────────────────────────────────────────
-- Insert into auth.users; the handle_new_user trigger creates the matching
-- public.users row. Then we sync role/name on the public row.
DO $$
DECLARE
  v_admin  UUID;
  v_journ  UUID;
  v_reader UUID;
BEGIN
  -- admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@026newsblog.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'admin@026newsblog.com',       extensions.crypt('Password123!', extensions.gen_salt('bf')), now(),
      '{"name":"Site Admin","role":"admin"}'::jsonb, now(), now(), '', '', '', ''
      ) RETURNING id INTO v_admin;
  ELSE
    SELECT id INTO v_admin FROM auth.users WHERE email = 'admin@026newsblog.com';
  END IF;

  -- journalist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'journalist@026newsblog.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'journalist@026newsblog.com',       extensions.crypt('Password123!', extensions.gen_salt('bf')), now(),
      '{"name":"Jane Reporter","role":"journalist"}'::jsonb, now(), now(), '', '', '', ''
      ) RETURNING id INTO v_journ;
  ELSE
    SELECT id INTO v_journ FROM auth.users WHERE email = 'journalist@026newsblog.com';
  END IF;

  -- reader
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'reader@026newsblog.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'reader@026newsblog.com',       extensions.crypt('Password123!', extensions.gen_salt('bf')), now(),
      '{"name":"Sam Reader","role":"reader"}'::jsonb, now(), now(), '', '', '', ''
      ) RETURNING id INTO v_reader;
  ELSE
    SELECT id INTO v_reader FROM auth.users WHERE email = 'reader@026newsblog.com';
  END IF;

  -- Ensure public.users rows exist & are correctly attributed
  INSERT INTO public.users (auth_id, name, email, role, status, password_hash)
  SELECT v_admin,  'Site Admin',   'admin@026newsblog.com',      'admin',      'active', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE auth_id = v_admin);

  INSERT INTO public.users (auth_id, name, email, role, status, password_hash)
  SELECT v_journ,  'Jane Reporter', 'journalist@026newsblog.com', 'journalist', 'active', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE auth_id = v_journ);

  INSERT INTO public.users (auth_id, name, email, role, status, password_hash)
  SELECT v_reader, 'Sam Reader',   'reader@026newsblog.com',     'reader',     'active', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE auth_id = v_reader);

  UPDATE public.users SET role = 'admin',      name = 'Site Admin',   status = 'active' WHERE auth_id = v_admin;
  UPDATE public.users SET role = 'journalist', name = 'Jane Reporter', status = 'active' WHERE auth_id = v_journ;
  UPDATE public.users SET role = 'reader',     name = 'Sam Reader',   status = 'active' WHERE auth_id = v_reader;
END $$;

-- ── SAMPLE PUBLISHED ARTICLES (for preview) ─────────────────
DO $$
DECLARE
  v_journ_id BIGINT;
  v_cat_pol  BIGINT;
  v_cat_tech BIGINT;
  v_cat_biz  BIGINT;
  v_a1 BIGINT;
  v_a2 BIGINT;
  v_a3 BIGINT;
  v_reader_id BIGINT;
BEGIN
  SELECT user_id INTO v_journ_id FROM public.users WHERE email = 'journalist@026newsblog.com';
  SELECT user_id INTO v_reader_id FROM public.users WHERE email = 'reader@026newsblog.com';
  SELECT category_id INTO v_cat_pol  FROM public.categories WHERE slug = 'politics';
  SELECT category_id INTO v_cat_tech FROM public.categories WHERE slug = 'tech';
  SELECT category_id INTO v_cat_biz  FROM public.categories WHERE slug = 'business';

  INSERT INTO public.articles (title, slug, content, excerpt, category_id, author_id, status,
    monetization_type, featured_image, tags, views, likes, published_at, featured, regions)
  SELECT
    'East Africa Leaders Pledge Deeper Trade Integration',
    'east-africa-trade-integration',
    'Heads of state from the East African Community met this week to announce a renewed push for deeper trade integration across member states, aiming to cut non-tariff barriers and harmonize customs procedures by the end of the year.',
    'A renewed push for deeper trade integration across East Africa.',
    v_cat_pol, v_journ_id, 'published', 'free',
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200',
    ARRAY['trade','eac','policy'], 142, 12, NOW() - INTERVAL '2 days', TRUE,
    ARRAY['ke','ug','tz','global']::region_code[]
  WHERE NOT EXISTS (SELECT 1 FROM public.articles WHERE slug = 'east-africa-trade-integration')
  RETURNING article_id INTO v_a1;

  INSERT INTO public.articles (title, slug, content, excerpt, category_id, author_id, status,
    monetization_type, featured_image, tags, views, likes, published_at, regions)
  SELECT
    'Kenyan Startups Raise Record Funding in Q2',
    'kenya-startups-q2-funding',
    'Kenyan technology startups raised a record amount of venture capital in the second quarter, led by fintech and climate-tech ventures targeting underserved markets across the continent.',
    'A record quarter for Kenyan tech funding.',
    v_cat_tech, v_journ_id, 'published', 'free',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200',
    ARRAY['startups','fintech','funding'], 98, 7, NOW() - INTERVAL '1 day',
    ARRAY['ke','ng','global']::region_code[]
  WHERE NOT EXISTS (SELECT 1 FROM public.articles WHERE slug = 'kenya-startups-q2-funding')
  RETURNING article_id INTO v_a2;

  INSERT INTO public.articles (title, slug, content, excerpt, category_id, author_id, status,
    monetization_type, featured_image, tags, views, likes, published_at, regions)
  SELECT
    'Global Markets Rally on Cooling Inflation Data',
    'global-markets-rally-inflation',
    'Equity markets worldwide rallied after fresh data showed inflation cooling faster than expected, easing pressure on central banks to maintain restrictive monetary policy.',
    'Markets rallied as inflation data came in cooler than expected.',
    v_cat_biz, v_journ_id, 'published', 'free',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200',
    ARRAY['markets','inflation','economy'], 211, 19, NOW() - INTERVAL '6 hours',
    ARRAY['global']::region_code[]
  WHERE NOT EXISTS (SELECT 1 FROM public.articles WHERE slug = 'global-markets-rally-inflation')
  RETURNING article_id INTO v_a3;

  -- Seed an analytics row for each so counts show up
  INSERT INTO public.analytics (article_id, views, likes, shares, comments_count)
  SELECT a.article_id, a.views, a.likes, 3, 1
  FROM public.articles a
  WHERE a.slug IN ('east-africa-trade-integration','kenya-startups-q2-funding','global-markets-rally-inflation')
    AND NOT EXISTS (SELECT 1 FROM public.analytics an WHERE an.article_id = a.article_id);

  -- A comment by the reader on the first article
  IF v_a1 IS NOT NULL AND v_reader_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.comments WHERE article_id = v_a1 AND user_id = v_reader_id
    ) THEN
      INSERT INTO public.comments (article_id, user_id, comment_text, status)
      VALUES (v_a1, v_reader_id, 'Great to see concrete steps on non-tariff barriers. Hope implementation follows.', 'visible');
    END IF;
  END IF;

  -- Reader saves the second article
  IF v_a2 IS NOT NULL AND v_reader_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.saved_articles WHERE user_id = v_reader_id AND article_id = v_a2
    ) THEN
      INSERT INTO public.saved_articles (user_id, article_id, notes)
      VALUES (v_reader_id, v_a2, 'Follow up on funding figures');
    END IF;
  END IF;
END $$;
