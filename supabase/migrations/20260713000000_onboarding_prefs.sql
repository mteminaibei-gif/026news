-- Onboarding preference columns for the new signup/onboarding flow.
-- Reader accounts created via /api/auth/onboard store their picked interests,
-- notification preferences, and (optional) author-application payload here.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS interests           TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notification_prefs  JSONB     DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS author_application  JSONB     DEFAULT NULL;
