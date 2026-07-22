import { useCallback, useEffect, useState, useRef } from 'react'

export interface SocialPost {
  post_id: number
  user_id: number
  content: string
  image_urls: string[] | null
  tags: string[] | null
  like_count: number
  comment_count: number
  share_count: number
  created_at: string
  liked?: boolean
  saved?: boolean
  author: {
    user_id: number
    name: string
    profile_image: string | null
    bio: string | null
    role: string
  } | null
}

export interface SocialComment {
  comment_id: number
  post_id: number
  user_id: number
  parent_comment_id: number | null
  comment_text: string
  like_count: number
  created_at: string
  author: { user_id: number; name: string; profile_image: string | null } | null
}

export function usePosts(feed: 'home' | 'following' | 'saved' = 'home') {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (reset = true) => {
    try {
      if (reset) setLoading(true)
      const cursorParam = reset || !nextCursor ? '' : `&cursor=${encodeURIComponent(nextCursor)}`
      const res = await fetch(`/api/posts?feed=${feed}${cursorParam}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      const incoming: SocialPost[] = data.posts ?? []
      setPosts(prev => (reset ? incoming : [...prev, ...incoming]))
      setNextCursor(data.nextCursor ?? null)
    } catch {
      setError('Could not load the feed')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [feed, nextCursor])

  useEffect(() => {
    setPosts([])
    setNextCursor(null)
    load(true)
  }, [load])

  // Live feed: prepend posts created in realtime (home feed only)
  const channelRef = useRef<any>(null)
  const idsRef = useRef<Set<number>>(new Set())
  useEffect(() => { idsRef.current = new Set(posts.map(p => p.post_id)) }, [posts])

  useEffect(() => {
    if (feed !== 'home') return
    let active = true
    ;(async () => {
      try {
        const supabase = (await import('@/lib/supabase/client')).createClient() as any
        const ch = supabase
          .channel('rt:posts:global')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload: any) => {
            if (!active) return
            const row = payload.new
            if (idsRef.current.has(row.post_id)) return
            try {
              const { data } = await supabase
                .from('posts')
                .select('*, author:users(user_id,name,profile_image,bio,role)')
                .eq('post_id', row.post_id)
                .single()
              if (data && active && !idsRef.current.has(data.post_id)) {
                idsRef.current.add(data.post_id)
                setPosts(prev => [data as SocialPost, ...prev])
              }
            } catch { /* ignore */ }
          })
          .subscribe(() => {})
        channelRef.current = ch
      } catch { /* ignore */ }
    })()
    return () => { active = false; if (channelRef.current) channelRef.current.unsubscribe() }
  }, [feed])

  const createPost = useCallback(async (content: string, image_urls?: string[], tags?: string[]) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, image_urls, tags }),
    })
    if (!res.ok) throw new Error('Failed to post')
    const data = await res.json()
    setPosts(prev => [data.post as SocialPost, ...prev])
    return data.post as SocialPost
  }, [])

  const toggleLike = useCallback(async (postId: number) => {
    // optimistic
    setPosts(prev => prev.map(p => p.post_id === postId
      ? { ...p, liked: !p.liked, like_count: p.like_count + (p.liked ? -1 : 1) }
      : p))
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setPosts(prev => prev.map(p => p.post_id === postId
          ? { ...p, liked: data.liked, like_count: data.like_count }
          : p))
      }
    } catch {
      /* keep optimistic */
    }
  }, [])

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    load(false)
  }, [nextCursor, loadingMore, load])

  return { posts, loading, loadingMore, error, loadMore, hasMore: !!nextCursor, createPost, toggleLike, refetch: () => load(true) }
}

export function usePostComments(postId: number | null) {
  const [comments, setComments] = useState<SocialComment[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => { load() }, [load])

  const addComment = useCallback(async (text: string, parent_comment_id?: number) => {
    if (!postId) return false
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_text: text, parent_comment_id }),
    })
    if (res.ok) {
      const data = await res.json()
      setComments(prev => [...prev, data.comment as SocialComment])
      return true
    }
    return false
  }, [postId])

  return { comments, loading, addComment, refetch: load }
}

export function useUserPosts(userId: number | null) {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient() as any
      const { data } = await supabase
        .from('posts')
        .select('*, author:users(user_id,name,profile_image,bio,role)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      setPosts((data ?? []) as SocialPost[])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return { posts, loading, refetch: load }
}
