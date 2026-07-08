// RealtimeArticlesList.tsx
// Client component that displays a list of articles and updates in real‑time via Supabase.

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // client‑side Supabase helper
import { ArticlesList } from '@/components/news/ArticlesList';
import { ArticleWithAuthor } from '@/lib/supabase/types';

interface Props {
  initialArticles: ArticleWithAuthor[];
}

export function RealtimeArticlesList({ initialArticles }: Props) {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>(initialArticles);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('public:articles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, (payload) => {
        const newArticle = payload.new as ArticleWithAuthor;
        // Show only published articles (skip drafts, etc.)
        if (newArticle.status === 'published') {
          setArticles((prev) => [newArticle, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <ArticlesList initialArticles={articles} categoryFilterName={undefined} />;
}
