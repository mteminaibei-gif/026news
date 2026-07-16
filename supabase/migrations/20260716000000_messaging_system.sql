-- ============================================================
--  Messaging System Migration
--  Creates / upgrades the messages table with proper schema,
--  RLS policies, indexes, and realtime publication.
-- ============================================================

-- ── Create table if it doesn't exist ─────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  message_id  BIGSERIAL    PRIMARY KEY,
  sender_id   BIGINT       NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  receiver_id BIGINT       NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  content     TEXT         NOT NULL,
  is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Migrate from legacy `message` column → `content` ─────
-- If the table existed before with a `message` text column,
-- copy data over, then drop the old column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'message'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'content'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN content TEXT NOT NULL DEFAULT '';
    UPDATE public.messages SET content = message WHERE content = '';
    ALTER TABLE public.messages DROP COLUMN message;
  END IF;

  -- Ensure `content` column exists even if neither `message` nor `content` existed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'content'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN content TEXT NOT NULL DEFAULT '';
  END IF;

  -- Ensure `is_read` column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- ── Foreign keys (idempotent) ────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'messages'
      AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%sender%'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_sender_fk
      FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'messages'
      AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%receiver%'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_receiver_fk
      FOREIGN KEY (receiver_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_participants
  ON public.messages (sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON public.messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON public.messages (receiver_id) WHERE is_read = FALSE;

-- ── Row Level Security ───────────────────────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Sender or receiver can read their own conversations
DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE user_id = sender_id
    )
    OR
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE user_id = receiver_id
    )
  );

-- Authenticated users can insert messages as themselves
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;
CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE user_id = sender_id
    )
  );

-- Sender or receiver can mark messages as read (update is_read)
DROP POLICY IF EXISTS "Participants can update read status" ON public.messages;
CREATE POLICY "Participants can update read status"
  ON public.messages FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE user_id = sender_id
    )
    OR
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE user_id = receiver_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE user_id = sender_id
    )
    OR
    auth.uid() IN (
      SELECT auth_id FROM public.users WHERE user_id = receiver_id
    )
  );

-- ── Enable Realtime ──────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
