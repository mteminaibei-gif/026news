-- Seed podcasts with the initial Kenya + Global lists.
-- Idempotent: only inserts when the table is empty.

INSERT INTO public.podcasts (title, author, region, episodes, duration, cover_color, rank)
SELECT * FROM (VALUES
  -- Kenya Podcasts
  ('Kenya Talks', 'NRG Radio', 'ke', 186, '45 min', '#e11d48', 1),
  ('The Trend Factory', 'Capital FM', 'ke', 98, '38 min', '#0f766e', 2),
  ('Stories of Africa', 'Radio Citizen', 'ke', 142, '52 min', '#16a34a', 3),
  ('Tech Pulse Africa', 'Kiss 100', 'ke', 89, '35 min', '#db2777', 4),
  ('On the Pitch KE', 'Radio Jambo', 'ke', 210, '40 min', '#0891b2', 5),
  ('Biz Breakfast', 'Classic 105', 'ke', 178, '32 min', '#ea580c', 6),
  -- Global Podcasts
  ('The Daily', 'The New York Times', 'global', 1240, '25 min', '#2563eb', 7),
  ('BBC Global News', 'BBC World Service', 'global', 980, '30 min', '#7c3aed', 8),
  ('How I Built This', 'NPR', 'global', 410, '50 min', '#ca8a04', 9),
  ('TED Talks Daily', 'TED', 'global', 1560, '15 min', '#dc2626', 10),
  ('The Economist Asks', 'The Economist', 'global', 320, '28 min', '#16a34a', 11),
  ('Waveform', 'MrMobile & dbrand', 'global', 265, '60 min', '#0891b2', 12)
) AS seed(title, author, region, episodes, duration, cover_color, rank)
WHERE NOT EXISTS (SELECT 1 FROM public.podcasts);
