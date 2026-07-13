-- Gmail integration: stores the OAuth tokens for the single app-owned Gmail
-- account used as the newsroom inbox. Only the server (service role) touches
-- this table; the admin-only API routes are the gate. RLS is intentionally
-- left off because access is mediated entirely by server-side admin checks.
create table if not exists gmail_integration (
  id            int primary key default 1,
  access_token  text,          -- AES-256-GCM encrypted
  refresh_token text,          -- AES-256-GCM encrypted
  email         text,          -- connected Gmail address (From:)
  expires_at    timestamptz,   -- absolute expiry of the access token
  updated_at    timestamptz default now()
);

-- Keep a single row; the connect/callback flow upserts id = 1.
comment on table gmail_integration is
  'OAuth credentials for the 026NEWS Gmail inbox (one app-owned account).';
