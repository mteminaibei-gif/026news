-- Performance indexes for comments, messages, articles, and notifications
-- Created after ChatWidget and comments sanitization work

-- Comments: speed up fetching by article + status
CREATE INDEX IF NOT EXISTS idx_comments_article_status
  ON public.comments (article_id, status, created_at DESC);

-- Messages: finding recent messages in a conversation thread (sender↔receiver pairs)
CREATE INDEX IF NOT EXISTS idx_messages_thread
  ON public.messages (sender_id, receiver_id, created_at DESC);

-- Articles: filtering by status + published date (common listing query)
CREATE INDEX IF NOT EXISTS idx_articles_status_published
  ON public.articles (status, published_at DESC)
  WHERE status = 'published';

-- Articles: journalistic/admin listing by updated_at
CREATE INDEX IF NOT EXISTS idx_articles_updated
  ON public.articles (updated_at DESC);

-- Notifications: user's timeline sorted by newest
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
