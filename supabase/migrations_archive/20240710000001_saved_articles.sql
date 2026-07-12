-- Create saved_articles table for user bookmarks
CREATE TABLE IF NOT EXISTS public.saved_articles (
  saved_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  article_id BIGINT NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  -- Prevent duplicate saves
  UNIQUE(user_id, article_id),
  
  -- Indexes for fast lookups
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_article FOREIGN KEY (article_id) REFERENCES public.articles(article_id) ON DELETE CASCADE
);

-- Create index for user-specific saved articles queries
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id 
  ON public.saved_articles(user_id, saved_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_articles_article_id 
  ON public.saved_articles(article_id);

-- Enable RLS for saved_articles table
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own saved articles
CREATE POLICY "Users can view their own saved articles"
  ON public.saved_articles
  FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id));

-- RLS Policy: Users can insert their own saved articles
CREATE POLICY "Users can save articles"
  ON public.saved_articles
  FOR INSERT
  WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id));

-- RLS Policy: Users can delete their own saved articles
CREATE POLICY "Users can remove saved articles"
  ON public.saved_articles
  FOR DELETE
  USING (auth.uid() = (SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id));

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.saved_articles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_articles TO anon;
