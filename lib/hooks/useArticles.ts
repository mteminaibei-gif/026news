'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { MonetizationType } from '@/lib/supabase/types'

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const articleKeys = {
  all:      () => ['articles'] as const,
  lists:    () => [...articleKeys.all(), 'list'] as const,
  list:     (filters: Record<string, unknown>) => [...articleKeys.lists(), filters] as const,
  detail:   (slug: string) => [...articleKeys.all(), 'detail', slug] as const,
  byAuthor: (authorId: number) => [...articleKeys.all(), 'author', authorId] as const,
  pending:  () => [...articleKeys.all(), 'pending'] as const,
}

// ─── Fetch published articles ─────────────────────────────────────────────────
export function useArticles(filters: { category?: string } = {}) {
  return useQuery({
    queryKey: articleKeys.list({ ...filters, status: 'published' }),
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'published' })
      if (filters.category) params.set('category', filters.category)
      const res = await fetch(`/api/articles?${params}`)
      if (!res.ok) throw new Error('Failed to fetch articles')
      const json = await res.json()
      return json.articles ?? []
    },
  })
}

// ─── Fetch single article by slug ─────────────────────────────────────────────
export function useArticle(slug: string) {
  return useQuery({
    queryKey: articleKeys.detail(slug),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('articles')
        .select('*, author:users(user_id,name,profile_image,bio), category:categories(name), analytics(views,likes,shares,comments_count)')
        .eq('slug', slug)
        .eq('status', 'published' as never)
        .single()
      if (error) throw error
      // Increment view count (fire-and-forget)
      supabase.from('articles')
        .update({ views: ((data as unknown as { views: number }).views ?? 0) + 1 } as never)
        .eq('slug', slug)
        .then(() => {})
      return data
    },
    enabled: !!slug,
  })
}

// ─── Fetch journalist's own articles ─────────────────────────────────────────
export function useMyArticles(authorId: number) {
  return useQuery({
    queryKey: articleKeys.byAuthor(authorId),
    queryFn: async () => {
      const params = new URLSearchParams({ author_id: String(authorId), status: 'all' })
      const res = await fetch(`/api/articles?${params}`)
      if (!res.ok) throw new Error('Failed to fetch articles')
      const json = await res.json()
      return json.articles ?? []
    },
    enabled: !!authorId,
  })
}

// ─── Admin: fetch articles pending review ─────────────────────────────────────
export function usePendingArticles() {
  return useQuery({
    queryKey: articleKeys.pending(),
    queryFn: async () => {
      const res = await fetch('/api/articles/review')
      if (!res.ok) throw new Error('Failed to fetch pending articles')
      return res.json()
    },
    refetchInterval: 30_000,
  })
}

// ─── Create article mutation ──────────────────────────────────────────────────
export interface CreateArticleInput {
  title: string
  content: string
  category?: string
  category_id?: number
  author_id?: number
  source_reference?: string
  monetization_type?: MonetizationType
  featured_image?: string
  tags?: string[]
  action: 'draft' | 'submit'
}

export function useCreateArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateArticleInput) => {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create article')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      if (variables.author_id) {
        queryClient.invalidateQueries({ queryKey: articleKeys.byAuthor(variables.author_id) })
      }
      queryClient.invalidateQueries({ queryKey: articleKeys.pending() })
    },
  })
}

// ─── Review article mutation ──────────────────────────────────────────────────
export interface ReviewArticleInput {
  id: number
  action: 'approve' | 'reject' | 'revision'
  notes?: string
  feature_homepage?: boolean
  publish_status?: string
}

export function useReviewArticle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ReviewArticleInput) => {
      const res = await fetch('/api/articles/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Review failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.pending() })
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() })
    },
  })
}
