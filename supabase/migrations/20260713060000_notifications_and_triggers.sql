-- ============================================================================
--  Notifications: persistence + automated triggers
--  The live DB had no `notifications` table and nothing was ever written to it
--  (the UI fabricated notifications in-memory). This migration creates the
--  table if missing, fixes RLS so Realtime only delivers a user's own rows,
--  and wires database triggers that persist real events.
-- ============================================================================

-- ── Table (create if missing; include type/link so later ALTERs are no-ops) ───
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id BIGSERIAL   PRIMARY KEY,
  user_id         BIGINT      REFERENCES public.users(user_id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  message         TEXT        NOT NULL,
  type            TEXT        NOT NULL DEFAULT 'system',
  link            TEXT,
  read            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS link TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR ALL
  USING (
    auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = notifications.user_id)
  );

-- Realtime: make sure the table is in the publication so clients get live rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ── Helper functions (SECURITY DEFINER so triggers can write past RLS) ────────
CREATE OR REPLACE FUNCTION public.notify_admins(
  p_title   TEXT,
  p_message TEXT,
  p_type    TEXT DEFAULT 'system',
  p_link    TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT user_id, p_title, p_message, p_type, p_link
  FROM public.users
  WHERE role = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id BIGINT,
  p_title   TEXT,
  p_message TEXT,
  p_type    TEXT DEFAULT 'system',
  p_link    TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (p_user_id, p_title, p_message, p_type, p_link);
  END IF;
END;
$$;

-- ── Trigger: article submitted for review -> notify admins ────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_submission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'under_review' AND (OLD.status IS NULL OR OLD.status <> 'under_review') THEN
    PERFORM public.notify_admins(
      'New article submission',
      '“' || NEW.title || '” is awaiting review.',
      'new_submission',
      '/admin/review/' || NEW.article_id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_submission ON public.articles;
CREATE TRIGGER trg_notify_submission
  AFTER UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_submission();

-- ── Trigger: review decision -> notify the author ─────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_author BIGINT;
  v_title  TEXT;
  v_slug   TEXT;
  v_label  TEXT;
BEGIN
  SELECT author_id, title, slug
    INTO v_author, v_title, v_slug
  FROM public.articles
  WHERE article_id = NEW.article_id;

  IF v_author IS NULL THEN
    RETURN NEW;
  END IF;

  v_label := CASE NEW.action
    WHEN 'approved'           THEN '✅ Your article was approved and published'
    WHEN 'rejected'           THEN '❌ Your article was rejected'
    WHEN 'revision_requested' THEN '🔄 Revision requested on your article'
    ELSE NEW.action::text
  END;

  PERFORM public.notify_user(
    v_author,
    'Article update',
    v_label || ': “' || v_title || '”',
    NEW.action::text,
    CASE WHEN NEW.action = 'approved'
      THEN '/article/' || v_slug
      ELSE '/admin/review/' || NEW.article_id::text
    END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_review ON public.review_workflow;
CREATE TRIGGER trg_notify_review
  AFTER INSERT ON public.review_workflow
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_review();

-- ── Trigger: new user signup -> notify admins ────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.notify_admins(
    'New user registered',
    '🆕 ' || COALESCE(NULLIF(NEW.name, ''), NEW.email) || ' joined as ' || NEW.role || '.',
    'new_user',
    '/admin/users'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_user ON public.users;
CREATE TRIGGER trg_notify_new_user
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_new_user();

-- ── Trigger: new comment -> notify the article's author ───────────────────────
CREATE OR REPLACE FUNCTION public.trg_notify_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_author BIGINT;
  v_title  TEXT;
  v_slug   TEXT;
BEGIN
  SELECT author_id, title, slug
    INTO v_author, v_title, v_slug
  FROM public.articles
  WHERE article_id = NEW.article_id;

  -- Don't notify authors about their own comments.
  IF v_author IS NULL OR v_author = NEW.user_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.notify_user(
    v_author,
    'New comment',
    '💬 New comment on “' || v_title || '”.',
    'new_comment',
    '/article/' || v_slug
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.comments;
CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_comment();

-- ── Default admin-managed settings (RSS + in-house publish limits, etc.) ──────
INSERT INTO public.site_settings (key, value) VALUES
  ('general',            '{"site_name": "026NEWS", "tagline": "Kenya''s Premier Digital News Platform", "contact_email": "hello@026news.com", "app_url": "https://026news.vercel.app"}'::jsonb),
  ('monetization',       '{"revenue_share": 70, "min_payout": 25, "adsense_publisher_id": "", "stripe_publishable_key": "", "mpesa_consumer_key": ""}'::jsonb),
  ('admin_notifications', '{"new_submission": true, "article_decision": true, "new_user": true, "flagged_comment": true, "payout_request": false, "revenue_milestone": false}'::jsonb),
  ('security',           '{"email_verification": true, "two_factor": false, "rate_limiting": true, "block_vpn": false, "rls_enabled": true}'::jsonb),
  ('publishing_config',  '{"rss_auto_publish": true, "rss_max_per_fetch": 20, "inhouse_publish_limit": 30}'::jsonb)
ON CONFLICT (key) DO NOTHING;
