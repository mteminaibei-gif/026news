'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const commentKeys = {
  byArticle: (articleId: number) => ['comments', articleId] as const,
}

// ─── Comment type ─────────────────────────────────────────────────────────────
export interface LiveComment {
  comment_id: number
  article_id: number
  comment_text: string
  created_at: string
  status: 'visible' | 'hidden' | 'flagged'
  user: { name: string; profile_image: string | null } | null
}

// ─── Fetch comments for an article ───────────────────────────────────────────
export function useComments(articleId: number) {
  return useQuery({
    queryKey: commentKeys.byArticle(articleId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:users ( name, profile_image )')
        .eq('article_id', articleId)
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as LiveComment[]
    },
    enabled: !!articleId,
  })
}

// ─── Post a new comment ───────────────────────────────────────────────────────
export function usePostComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      article_id,
      user_id,
      comment_text,
    }: {
      article_id: number
      user_id: number
      comment_text: string
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('comments')
        .insert({ article_id, user_id, comment_text, status: 'visible' } as never)
        .select('*, user:users ( name, profile_image )')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byArticle(variables.article_id) })
    },
  })
}

// ─── Realtime live comments hook ──────────────────────────────────────────────
// Subscribes to Supabase Realtime channel for the article's comments table.
// New comments from ANY user appear instantly without polling.
export function useLiveComments(articleId: number) {
  const queryClient = useQueryClient()
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Initial load via React Query
  const query = useComments(articleId)

  useEffect(() => {
    if (!articleId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`comments:article:${articleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${articleId}`,
        },
        async (payload) => {
          // Fetch the full comment row with user join
          const { data } = await supabase
            .from('comments')
            .select('*, user:users ( name, profile_image )')
            .eq('comment_id', payload.new.comment_id)
            .single()

          if (data) {
            // Prepend to cached comment list
            queryClient.setQueryData(
              commentKeys.byArticle(articleId),
              (old: LiveComment[] | undefined) => [data as LiveComment, ...(old ?? [])]
            )
          }
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [articleId, queryClient])

  return { ...query, isSubscribed }
}
