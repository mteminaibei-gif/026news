-- Media tables for Radio & Podcasts realtime sections
-- Kenya Podcasts, Global Podcasts, and Recently Played.

CREATE TABLE IF NOT EXISTS public.podcasts (
  podcast_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title        TEXT NOT NULL,
  author       TEXT NOT NULL,
  region       TEXT NOT NULL DEFAULT 'global',          -- 'ke' | 'global'
  episodes     INT  NOT NULL DEFAULT 0,
  duration     TEXT NOT NULL DEFAULT '30 min',
  cover_color  TEXT NOT NULL DEFAULT '#2563eb',
  feed_url     TEXT,                                     -- optional external RSS feed
  description  TEXT,
  rank         INT  NOT NULL DEFAULT 0,                  -- display order
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recently_played (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT NOT NULL,
  station     TEXT NOT NULL,
  played_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     UUID,                                      -- null = anonymous/global
  source      TEXT NOT NULL DEFAULT 'radio',             -- 'radio' | 'podcast' | 'tv'
  cover_color TEXT DEFAULT '#2563eb'
);

CREATE INDEX IF NOT EXISTS idx_podcasts_region_active ON public.podcasts (region, active, rank);
CREATE INDEX IF NOT EXISTS idx_recently_played_played_at ON public.recently_played (played_at DESC);

-- Realtime: broadcast changes on these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.podcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recently_played;

-- Updated-at trigger for podcasts
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_podcasts_updated_at ON public.podcasts;
CREATE TRIGGER trg_podcasts_updated_at
  BEFORE UPDATE ON public.podcasts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
