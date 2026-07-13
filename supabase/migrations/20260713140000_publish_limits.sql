-- Make publish limits unlimited by default (0 = unlimited). The admin can set a
-- hard cap from the dashboard "Publish Limits" card; until then the app may
-- publish an unlimited number of posts.
UPDATE site_settings
SET value = jsonb_build_object('inhouse', 0, 'sourced', 0)
WHERE key = 'publish_limits';

-- Enforce the in-house publish limit globally: block publishing a new in-house
-- (non-aggregated) article once the total number of published in-house articles
-- on the platform reaches the admin-set `inhouse` limit. 0 / NULL = unlimited.
CREATE OR REPLACE FUNCTION enforce_inhouse_publish_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit int;
  v_count int;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'published' AND COALESCE(NEW.is_aggregated, false) IS NOT TRUE)
     OR (TG_OP = 'UPDATE' AND NEW.status = 'published'
         AND OLD.status IS DISTINCT FROM 'published'
         AND COALESCE(NEW.is_aggregated, false) IS NOT TRUE) THEN

    SELECT COALESCE((value->>'inhouse')::int, 0)
      INTO v_limit
      FROM site_settings
      WHERE key = 'publish_limits';

    IF v_limit IS NULL OR v_limit <= 0 THEN
      RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_count
      FROM articles
      WHERE status = 'published'
        AND COALESCE(is_aggregated, false) IS NOT TRUE
        AND article_id IS DISTINCT FROM NEW.article_id;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'PUBLISH_LIMIT_REACHED: In-house publish limit of % reached.', v_limit
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_inhouse_publish_limit ON articles;
CREATE TRIGGER trg_enforce_inhouse_publish_limit
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION enforce_inhouse_publish_limit();
