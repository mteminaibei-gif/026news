-- Fix: trg_notify_submission must also fire on INSERT, not just UPDATE.
-- When a journalist submits an article, it is INSERTED with status 'under_review',
-- so the AFTER UPDATE trigger never fires.

DROP TRIGGER IF EXISTS trg_notify_submission ON public.articles;

CREATE OR REPLACE FUNCTION public.trg_notify_submission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'under_review' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status <> 'under_review') THEN
    PERFORM public.notify_admins(
      'New article submission',
      NEW.title || ' is awaiting review.',
      'new_submission',
      '/admin/review/' || NEW.article_id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_submission
  AFTER INSERT OR UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_submission();
