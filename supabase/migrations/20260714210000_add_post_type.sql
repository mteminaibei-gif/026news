-- Add post_type column to articles table
-- 'news' = short-form breaking news, 'article' = long-form content
ALTER TABLE articles ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'article';
CREATE INDEX IF NOT EXISTS idx_articles_post_type ON articles(post_type) WHERE status = 'published';

-- Classify existing articles by word count
UPDATE articles SET post_type = 'news'
WHERE status = 'published' AND post_type = 'article'
AND length(regexp_replace(content, '<[^>]+>', '', 'g')) < 2000;

UPDATE articles SET post_type = 'article'
WHERE status = 'published' AND post_type = 'news'
AND length(regexp_replace(content, '<[^>]+>', '', 'g')) >= 2000;
