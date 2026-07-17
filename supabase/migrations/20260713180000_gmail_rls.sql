-- Enable RLS on gmail_integration which stores OAuth tokens (access_token,
-- refresh_token). Without RLS, any authenticated user could read these
-- sensitive credentials via the PostgREST API.

ALTER TABLE public.gmail_integration ENABLE ROW LEVEL SECURITY;

-- Only admins may access Gmail integration tokens
DROP POLICY IF EXISTS "Admins can manage gmail_integration" ON public.gmail_integration;
CREATE POLICY "Admins can manage gmail_integration"
  ON public.gmail_integration
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );
