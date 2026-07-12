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

-- ── REGIONS ─────────────────────────────────────────────────
INSERT INTO public.regions (code, name, flag) VALUES
  ('ke',      'Kenya',          '🇰🇪'),
  ('ng',      'Nigeria',        '🇳🇬'),
  ('za',      'South Africa',   '🇿🇦'),
  ('gh',      'Ghana',          '🇬🇭'),
  ('ug',      'Uganda',         '🇺🇬'),
  ('tz',      'Tanzania',       '🇹🇿'),
  ('et',      'Ethiopia',       '🇪🇹'),
  ('global',  'Global',         '🌍')
ON CONFLICT (code) DO NOTHING;

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
      confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'admin@026newsblog.com', crypt('Password123!', gen_salt('bf')), now(),
      '{"name":"Site Admin","role":"admin"}'::jsonb, now(), now(), '', ''
    ) RETURNING id INTO v_admin;
  ELSE
    SELECT id INTO v_admin FROM auth.users WHERE email = 'admin@026newsblog.com';
  END IF;

  -- journalist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'journalist@026newsblog.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'journalist@026newsblog.com', crypt('Password123!', gen_salt('bf')), now(),
      '{"name":"Jane Reporter","role":"journalist"}'::jsonb, now(), now(), '', ''
    ) RETURNING id INTO v_journ;
  ELSE
    SELECT id INTO v_journ FROM auth.users WHERE email = 'journalist@026newsblog.com';
  END IF;

  -- reader
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'reader@026newsblog.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'reader@026newsblog.com', crypt('Password123!', gen_salt('bf')), now(),
      '{"name":"Sam Reader","role":"reader"}'::jsonb, now(), now(), '', ''
    ) RETURNING id INTO v_reader;
  ELSE
    SELECT id INTO v_reader FROM auth.users WHERE email = 'reader@026newsblog.com';
  END IF;

  -- Ensure public.users rows exist & are correctly attributed
  INSERT INTO public.users (auth_id, name, email, role, status, password_hash)
  SELECT v_admin,  'Site Admin',   'admin@026newsblog.com',      'admin',      'active', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE auth_id = v_admin)
  ON CONFLICT (auth_id) DO NOTHING;

  INSERT INTO public.users (auth_id, name, email, role, status, password_hash)
  SELECT v_journ,  'Jane Reporter', 'journalist@026newsblog.com', 'journalist', 'active', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE auth_id = v_journ)
  ON CONFLICT (auth_id) DO NOTHING;

  INSERT INTO public.users (auth_id, name, email, role, status, password_hash)
  SELECT v_reader, 'Sam Reader',   'reader@026newsblog.com',     'reader',     'active', ''
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE auth_id = v_reader)
  ON CONFLICT (auth_id) DO NOTHING;

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
  VALUES (
    'East Africa Leaders Pledge Deeper Trade Integration',
    'east-africa-trade-integration',
    'Heads of state from the East African Community met this week to announce a renewed push for deeper trade integration across member states, aiming to cut non-tariff barriers and harmonize customs procedures by the end of the year.',
    'A renewed push for deeper trade integration across East Africa.',
    v_cat_pol, v_journ_id, 'published', 'free',
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200',
    ARRAY['trade','eac','policy'], 142, 12, NOW() - INTERVAL '2 days', TRUE,
    ARRAY['ke','ug','tz','global']
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING article_id INTO v_a1;

  INSERT INTO public.articles (title, slug, content, excerpt, category_id, author_id, status,
    monetization_type, featured_image, tags, views, likes, published_at, regions)
  VALUES (
    'Kenyan Startups Raise Record Funding in Q2',
    'kenya-startups-q2-funding',
    'Kenyan technology startups raised a record amount of venture capital in the second quarter, led by fintech and climate-tech ventures targeting underserved markets across the continent.',
    'A record quarter for Kenyan tech funding.',
    v_cat_tech, v_journ_id, 'published', 'free',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200',
    ARRAY['startups','fintech','funding'], 98, 7, NOW() - INTERVAL '1 day',
    ARRAY['ke','ng','global']
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING article_id INTO v_a2;

  INSERT INTO public.articles (title, slug, content, excerpt, category_id, author_id, status,
    monetization_type, featured_image, tags, views, likes, published_at, regions)
  VALUES (
    'Global Markets Rally on Cooling Inflation Data',
    'global-markets-rally-inflation',
    'Equity markets worldwide rallied after fresh data showed inflation cooling faster than expected, easing pressure on central banks to maintain restrictive monetary policy.',
    'Markets rallied as inflation data came in cooler than expected.',
    v_cat_biz, v_journ_id, 'published', 'free',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200',
    ARRAY['markets','inflation','economy'], 211, 19, NOW() - INTERVAL '6 hours',
    ARRAY['global']
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING article_id INTO v_a3;

  -- Seed an analytics row for each so counts show up
  INSERT INTO public.analytics (article_id, views, likes, shares, comments_count)
  SELECT article_id, views, likes, 3, 1 FROM public.articles
  WHERE slug IN ('east-africa-trade-integration','kenya-startups-q2-funding','global-markets-rally-inflation')
  ON CONFLICT (article_id) DO NOTHING;

  -- A comment by the reader on the first article
  IF v_a1 IS NOT NULL AND v_reader_id IS NOT NULL THEN
    INSERT INTO public.comments (article_id, user_id, comment_text, status)
    VALUES (v_a1, v_reader_id, 'Great to see concrete steps on non-tariff barriers. Hope implementation follows.', 'visible')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Reader saves the second article
  IF v_a2 IS NOT NULL AND v_reader_id IS NOT NULL THEN
    INSERT INTO public.saved_articles (user_id, article_id, notes)
    VALUES (v_reader_id, v_a2, 'Follow up on funding figures')
    ON CONFLICT (user_id, article_id) DO NOTHING;
  END IF;
END $$;
