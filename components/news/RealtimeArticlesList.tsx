'use client'

import { ArticlesList } from '@/components/news/ArticlesList'
import { ArticleWithAuthor } from '@/lib/supabase/types'

interface Props {
  initialArticles: ArticleWithAuthor[]
}

// This component is now a thin wrapper — ArticlesList handles its own
// realtime subscriptions internally. No duplicate channel here.
export function RealtimeArticlesList({ initialArticles }: Props) {
  return <ArticlesList initialArticles={initialArticles} categoryFilterName={undefined} />
}
