-- Fix: Wrap trg_notify_submission in EXCEPTION block so notification failures
-- don't rollback the article INSERT/UPDATE.

CREATE OR REPLACE FUNCTION public.trg_notify_submission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'under_review' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status <> 'under_review') THEN
    BEGIN
      PERFORM public.notify_admins(
        'New article submission',
        NEW.title || ' is awaiting review.',
        'new_submission',
        '/admin/review/' || NEW.article_id::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- Notification failure should not block article creation
      RAISE WARNING 'Failed to send submission notification: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;
