-- Add default icons to existing categories that don't have one
UPDATE public.categories
SET icon = CASE
  WHEN name = 'Politics' THEN '🏛️'
  WHEN name = 'Business' THEN '💼'
  WHEN name = 'Tech' THEN '💻'
  WHEN name = 'Science' THEN '🔬'
  WHEN name = 'Entertainment' THEN '🎬'
  WHEN name = 'Sports' THEN '⚽'
  WHEN name = 'Kenya' THEN '🇰🇪'
  WHEN name = 'Africa' THEN '🌍'
  WHEN name = 'Health' THEN '🏥'
  WHEN name = 'Education' THEN '🎓'
  WHEN name = 'Agriculture' THEN '🌾'
  WHEN name = 'Lifestyle' THEN '🏠'
  WHEN name = 'Opinion' THEN '✍️'
  WHEN name = 'Crime & Justice' THEN '⚖️'
  WHEN name = 'Environment' THEN '🌿'
  WHEN name = 'Real Estate' THEN '🏠'
  WHEN name = 'Freelance' THEN '✍️'
  ELSE '📁'
END
WHERE icon IS NULL OR icon = '';

-- Ensure icon column exists (in case of older schema)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN icon TEXT;
  END IF;
END $$;