-- ============================================================
--  Group Chat (Newsroom Chat) Migration
--  Powers the /chat page: public + member rooms, messages,
--  and realtime. Client-side Supabase access guarded by RLS.
--  Idempotent: safe to re-run.
-- ============================================================

-- ── chat_rooms ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  room_id      BIGSERIAL    PRIMARY KEY,
  name         TEXT         NOT NULL,
  description  TEXT,
  created_by   BIGINT       NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  is_public    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_public ON public.chat_rooms(is_public);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created ON public.chat_rooms(created_at DESC);

-- ── chat_room_members ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_room_members (
  room_id   BIGINT       NOT NULL REFERENCES public.chat_rooms(room_id) ON DELETE CASCADE,
  user_id   BIGINT       NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON public.chat_room_members(user_id);

-- ── chat_messages ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  message_id  BIGSERIAL    PRIMARY KEY,
  room_id     BIGINT       NOT NULL REFERENCES public.chat_rooms(room_id) ON DELETE CASCADE,
  sender_id   BIGINT       NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  content     TEXT         NOT NULL,
  is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id, created_at DESC);

-- ── Enable RLS ──────────────────────────────────────────
ALTER TABLE public.chat_rooms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages     ENABLE ROW LEVEL SECURITY;

-- ── chat_rooms policies ─────────────────────────────────
DROP POLICY IF EXISTS "Public rooms are visible" ON public.chat_rooms;
CREATE POLICY "Public rooms are visible" ON public.chat_rooms
  FOR SELECT USING (is_public = TRUE);

DROP POLICY IF EXISTS "Members see their rooms" ON public.chat_rooms;
CREATE POLICY "Members see their rooms" ON public.chat_rooms
  FOR SELECT USING (
    room_id IN (
      SELECT crm.room_id FROM public.chat_room_members crm
      WHERE crm.user_id = (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users create rooms" ON public.chat_rooms;
CREATE POLICY "Authenticated users create rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Creators manage rooms" ON public.chat_rooms;
CREATE POLICY "Creators manage rooms" ON public.chat_rooms
  FOR UPDATE USING (
    created_by = (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid())
  );

-- ── chat_room_members policies ──────────────────────────
DROP POLICY IF EXISTS "Members see room membership" ON public.chat_room_members;
CREATE POLICY "Members see room membership" ON public.chat_room_members
  FOR SELECT USING (
    room_id IN (
      SELECT crm.room_id FROM public.chat_room_members crm
      WHERE crm.user_id = (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid())
    )
    OR room_id IN (SELECT cr.room_id FROM public.chat_rooms cr WHERE cr.is_public = TRUE)
  );

DROP POLICY IF EXISTS "Users join rooms" ON public.chat_room_members;
CREATE POLICY "Users join rooms" ON public.chat_room_members
  FOR INSERT WITH CHECK (
    user_id = (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users leave rooms" ON public.chat_room_members;
CREATE POLICY "Users leave rooms" ON public.chat_room_members
  FOR DELETE USING (
    user_id = (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid())
  );

-- ── chat_messages policies ──────────────────────────────
DROP POLICY IF EXISTS "Room members read messages" ON public.chat_messages;
CREATE POLICY "Room members read messages" ON public.chat_messages
  FOR SELECT USING (
    room_id IN (
      SELECT crm.room_id FROM public.chat_room_members crm
      WHERE crm.user_id = (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid())
    )
    OR room_id IN (SELECT cr.room_id FROM public.chat_rooms cr WHERE cr.is_public = TRUE)
  );

DROP POLICY IF EXISTS "Members send messages" ON public.chat_messages;
CREATE POLICY "Members send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid())
    AND (
      room_id IN (
        SELECT crm.room_id FROM public.chat_room_members crm
        WHERE crm.user_id = (SELECT u.user_id FROM public.users u WHERE u.auth_id = auth.uid())
      )
      OR room_id IN (SELECT cr.room_id FROM public.chat_rooms cr WHERE cr.is_public = TRUE)
    )
  );

-- ── Realtime ────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;
