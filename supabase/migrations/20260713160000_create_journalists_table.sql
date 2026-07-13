-- Create journalists table (referenced by app but missing from live DB)
CREATE TABLE IF NOT EXISTS public.journalists (
  user_id         INTEGER PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
  bio             TEXT,
  avatar_url      TEXT,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  commission_rate NUMERIC NOT NULL DEFAULT 0.15,
  total_earnings  NUMERIC NOT NULL DEFAULT 0,
  payment_method  JSONB,
  created_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.journalists ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Journalists can view own profile" ON public.journalists
  FOR SELECT USING (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Journalists can update own profile" ON public.journalists
  FOR UPDATE USING (user_id IN (SELECT user_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Public journalist profiles viewable" ON public.journalists
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage journalists" ON public.journalists
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Trigger for updated_at
CREATE TRIGGER set_journalists_updated_at
  BEFORE UPDATE ON public.journalists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed existing journalist users (user_id 56 = journalist@026newsblog.com)
INSERT INTO public.journalists (user_id, bio, verified, commission_rate, total_earnings)
SELECT user_id, bio, FALSE, 0.15, 0
FROM public.users
WHERE role = 'journalist'
ON CONFLICT (user_id) DO NOTHING;