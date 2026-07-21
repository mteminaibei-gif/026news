'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePosts } from '@/lib/hooks/usePosts'
import { useFollowSuggestions, useFollow } from '@/lib/hooks/useFollow'
import { PostCard } from '@/components/social/PostCard'
import { useUser, useProfile } from '@/lib/hooks/useAuth'
import { uploadPostMedia } from '@/lib/storage'
import { Image as ImageIcon, Users, Sparkles, UserPlus, X, Send, Bookmark } from 'lucide-react'

function FollowButton({ userId }: { userId: number }) {
  const { following, toggle, loading } = useFollow(userId)
  return (
    <button
      className={`social-follow-btn ${following ? 'following' : ''}`}
      onClick={toggle}
      disabled={loading}
    >
      {following ? 'Following' : (<><UserPlus size={14} /> Follow</>)}
    </button>
  )
}

function parseTags(content: string): string[] {
  const matches = content.match(/#(\w+)/g) ?? []
  return Array.from(new Set(matches.map(m => m.slice(1).toLowerCase()))).slice(0, 10)
}

function ComposeBox({
  createPost,
  onPosted,
}: {
  createPost: (content: string, image_urls?: string[], tags?: string[]) => Promise<any>
  onPosted?: () => void
}) {
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [focused, setFocused] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: user } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)

  const MAX_CHARS = 500
  const charCount = text.length
  const nearLimit = charCount > MAX_CHARS * 0.85
  const overLimit = charCount > MAX_CHARS

  const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setError(null)
    try {
      const uploaded = await Promise.all(
        files.slice(0, 4).map(f => uploadPostMedia(f, profile?.user_id ?? 0))
      )
      setImages(prev => [...prev, ...uploaded.filter(Boolean).map(u => u!.url)].slice(0, 4))
    } catch {
      setError('Could not upload image. Try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = async () => {
    const content = text.trim()
    if ((!content && images.length === 0) || posting || overLimit) return
    setPosting(true)
    setError(null)
    try {
      await createPost(content, images.length ? images : undefined, parseTags(content))
      setText('')
      setImages([])
      setFocused(false)
      onPosted?.()
    } catch (err: any) {
      setError(err?.message ? String(err.message) : 'Could not publish your post. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div
      className="social-compose"
      style={{
        transition: 'all 0.35s var(--ease-out-expo)',
        boxShadow: focused ? 'var(--glow-primary)' : 'var(--glow-soft)',
        borderColor: focused ? 'oklch(65% 0.12 175 / 0.4)' : undefined,
        transform: focused ? 'translateY(-1px)' : undefined,
      }}
    >
      <div className="social-compose-avatar">
        {profile?.profile_image
          ? <img src={profile.profile_image} alt="" />
          : <div>{profile?.name?.charAt(0).toUpperCase() ?? 'U'}</div>}
      </div>
      <div className="social-compose-main">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="What's happening in your world? Use #hashtags to tag topics."
          className="social-compose-input"
          rows={2}
          maxLength={MAX_CHARS}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            fontFamily: 'var(--font-ui)',
            transition: 'color 0.2s',
            color: overLimit ? 'var(--error)' : nearLimit ? 'var(--accent)' : 'var(--text-tertiary)',
          }}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>
        {images.length > 0 && (
          <div className="social-compose-images">
            {images.map((url, i) => (
              <div key={i} className="social-compose-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" />
                <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} aria-label="Remove">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="social-compose-actions">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickImages} />
          <button
            className="social-icon-btn"
            aria-label="Add image"
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              transition: 'all 0.25s var(--ease-out-expo)',
              transform: uploading ? 'scale(0.9)' : undefined,
            }}
          >
            <ImageIcon size={18} />
          </button>
          <button className="social-icon-btn" aria-label="Tag" type="button" onClick={() => setText(t => t + (t && !t.endsWith(' ') ? ' ' : '') + '#')}>
            <Users size={18} />
          </button>
          <button
            className="social-post-btn"
            onClick={submit}
            disabled={(!text.trim() && images.length === 0) || posting || uploading || overLimit}
            style={{
              transition: 'all 0.3s var(--ease-out-expo)',
              opacity: posting ? 0.7 : undefined,
              transform: posting ? 'scale(0.97)' : undefined,
            }}
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
        {error && <p className="social-compose-error" role="alert">{error}</p>}
      </div>
    </div>
  )
}

function Suggestions() {
  const { suggestions, loading } = useFollowSuggestions()
  const [onlineSet, setOnlineSet] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!suggestions.length) return
    import('@/lib/hooks/usePresence').then(({ fetchOnlineUsers }) => {
      fetchOnlineUsers(suggestions.map(s => s.user_id)).then(setOnlineSet)
    })
  }, [suggestions])

  if (loading) return (
    <p className="social-side-note" style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="animate-pulse-soft" style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--primary-light)', display: 'inline-block' }} />
      Finding people…
    </p>
  )
  if (!suggestions.length) return null
  return (
    <div className="social-suggest-card" style={{ animation: 'futr-fade-up 0.5s var(--ease-out-expo) both' }}>
      <h3 className="social-side-title"><Sparkles size={15} /> Who to follow</h3>
      <div className="social-suggest-list">
        {suggestions.slice(0, 5).map((s, i) => (
          <div
            key={s.user_id}
            className="social-suggest-item"
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.25s var(--ease-out-expo)',
              animation: `futr-fade-up 0.4s var(--ease-out-expo) ${i * 80}ms both`,
              cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface-2)'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <Link href={`/journalists/${s.user_id}`} className="social-suggest-avatar" style={{ position: 'relative' }}>
              {s.profile_image
                ? <img src={s.profile_image} alt={s.name} />
                : <div>{s.name.charAt(0).toUpperCase()}</div>}
              {onlineSet.has(s.user_id) && <span className="online-dot" />}
            </Link>
            <div className="social-suggest-meta">
              <Link href={`/journalists/${s.user_id}`} className="social-suggest-name">{s.name}</Link>
              <span className="social-suggest-role">{onlineSet.has(s.user_id) ? 'Online' : s.role}</span>
            </div>
            <FollowButton userId={s.user_id} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SocialPage() {
  const [tab, setTab] = useState<'home' | 'following' | 'saved'>('home')
  const feed = usePosts(tab)
  const { posts, loading, loadMore, hasMore, toggleLike, refetch } = feed
  const [openPostId, setOpenPostId] = useState<number | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pid = Number(params.get('post'))
    if (pid) setOpenPostId(pid)
  }, [])

  const allPosts = usePosts('home')
  const trending = useMemo(() => {
    const counts = new Map<string, number>()
    ;(allPosts.posts ?? []).forEach(p => (p.tags ?? []).forEach(t => counts.set(t, (counts.get(t) ?? 0) + 1)))
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [allPosts.posts])

  const tabs = [
    { key: 'home' as const, label: 'For You' },
    { key: 'following' as const, label: 'Following' },
    { key: 'saved' as const, label: 'Saved' },
  ]

  return (
    <div className="social-page">
      <div className="social-container">
        <main className="social-main">
          <div className="social-header">
            <h1 className="social-title">Social Feed</h1>
            <p className="social-subtitle">Posts, thoughts and updates from the 026 community</p>
          </div>

          <ComposeBox createPost={feed.createPost} onPosted={refetch} />
          <div id="compose" style={{ scrollMarginTop: 80 }} />

          <div className="social-tabs" role="tablist">
            {tabs.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={tab === t.key ? 'active' : ''}
                onClick={() => setTab(t.key)}
                style={{
                  position: 'relative',
                  transition: 'all 0.25s var(--ease-out-expo)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="social-feed">
            {loading && posts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{
                      height: 180,
                      borderRadius: 'var(--radius-lg)',
                      animationDelay: `${i * 150}ms`,
                    }}
                  />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="social-empty" style={{ animation: 'futr-fade-up 0.4s var(--ease-out-expo) both' }}>
                <p>{tab === 'saved' ? 'No saved posts yet. Tap the bookmark on any post.' : 'No posts yet. Be the first to share something!'}</p>
              </div>
            ) : (
              posts.map(p => <PostCard key={p.post_id} post={p} onToggleLike={toggleLike} onOpen={setOpenPostId} />)
            )}

            {hasMore && tab !== 'saved' && (
              <button
                className="social-load-more"
                onClick={loadMore}
                style={{
                  transition: 'all 0.3s var(--ease-out-expo)',
                }}
              >
                Load more
              </button>
            )}
          </div>
        </main>

        <aside className="social-sidebar">
          {trending.length > 0 && (
            <div className="social-suggest-card" style={{ animation: 'futr-fade-up 0.5s var(--ease-out-expo) 0.1s both' }}>
              <h3 className="social-side-title"><Sparkles size={15} /> Trending Topics</h3>
              <div className="social-trending">
                {trending.map(([tag, count]) => (
                  <button key={tag} className="social-trending-tag" onClick={() => setTab('home')}>
                    #{tag} <span>{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <Suggestions />
          <div className="social-side-card" style={{ animation: 'futr-fade-up 0.5s var(--ease-out-expo) 0.3s both' }}>
            <h3 className="social-side-title">Community Guidelines</h3>
            <p className="social-side-note">
              Be respectful. Share verified news. Tag topics with #hashtags.
            </p>
          </div>
        </aside>
      </div>

      {openPostId !== null && (
        <PostDetailModal postId={openPostId} onClose={() => setOpenPostId(null)} />
      )}
    </div>
  )
}

function PostDetailModal({ postId, onClose }: { postId: number; onClose: () => void }) {
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}`)
      if (res.ok) {
        const data = await res.json()
        setPost(data.post)
        setLiked(!!data.post?.liked)
        setLikeCount(data.post?.like_count ?? 0)
        setComments(data.comments ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => { load() }, [load])

  const handleLike = useCallback(async () => {
    if (liking) return
    setLiking(true)
    const next = !liked
    setLiked(next)
    setLikeCount(c => c + (next ? 1 : -1))
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setLiked(!!data.liked)
        setLikeCount(data.like_count ?? likeCount)
      }
    } catch {
      setLiked(!next)
      setLikeCount(c => c + (next ? -1 : 1))
    } finally {
      setLiking(false)
    }
  }, [liking, liked, likeCount, postId])

  const submit = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_text: text }),
    })
    if (res.ok) { const data = await res.json(); setComments(prev => [...prev, data.comment]) }
  }

  return (
    <div className="social-modal-overlay" onClick={onClose}>
      <div className="social-modal" onClick={e => e.stopPropagation()}>
        <div className="social-modal-head">
          <h2 className="social-title" style={{ fontSize: '1.1rem' }}>Post</h2>
          <button className="social-icon-btn" onClick={onClose} aria-label="Close" style={{ fontSize: '1rem' }}>✕</button>
        </div>
        {loading && !post ? (
          <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: '100%', height: 160, borderRadius: 'var(--radius-md)' }} />
          </div>
        ) : post ? (
          <>
            <PostCard
              post={{ ...post, liked, like_count: likeCount }}
              onToggleLike={() => handleLike()}
            />
            <div className="social-comments">
              {comments.map((c: any) => (
                <div key={c.comment_id} className="social-comment">
                  {c.author?.profile_image
                    ? <img src={c.author.profile_image} alt="" className="social-avatar-img" />
                    : <div className="social-avatar">{(c.author?.name ?? 'U').charAt(0).toUpperCase()}</div>}
                  <div className="social-comment-body">
                    <span className="social-comment-author">{c.author?.name ?? 'Unknown'}</span>
                    <p className="social-comment-text">{c.comment_text}</p>
                  </div>
                </div>
              ))}
              <div className="social-comment-compose">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  placeholder="Write a comment…"
                  className="social-comment-input"
                />
                <button onClick={submit} className="social-send-btn" aria-label="Send"><Send size={16} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="social-empty"><p>Post not found.</p></div>
        )}
      </div>
    </div>
  )
}
