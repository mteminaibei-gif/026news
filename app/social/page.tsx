'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePosts } from '@/lib/hooks/usePosts'
import { useFollowSuggestions, useFollow } from '@/lib/hooks/useFollow'
import { PostCard } from '@/components/social/PostCard'
import { useUser, useProfile } from '@/lib/hooks/useAuth'
import { uploadPostMedia } from '@/lib/storage'
import { EmojiPicker } from '@/components/social/EmojiPicker'
import { SponsoredCard } from '@/components/social/SponsoredCard'
import { Image as ImageIcon, Users, Sparkles, UserPlus, X, Send, Bookmark, Smile, Hash, MapPin } from 'lucide-react'

function FollowButton({ userId, currentUserId }: { userId: number; currentUserId?: number }) {
  const { following, toggle, loading } = useFollow(userId)
  if (currentUserId && userId === currentUserId) return null
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

const QUICK_EMOJIS = ['😂','🔥','❤️','👍','😮','💯','🎉','👀']

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
  const [showEmoji, setShowEmoji] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { data: user } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)

  const MAX_CHARS = 500
  const charCount = text.length
  const nearLimit = charCount > MAX_CHARS * 0.85
  const overLimit = charCount > MAX_CHARS
  const progress = Math.min(charCount / MAX_CHARS, 1)
  const circumference = 2 * Math.PI * 14

  useEffect(() => {
    if (mentionQuery === null) return
    const q = mentionQuery.toLowerCase()
    if (!q) { setMentionResults([]); return }
    const ctrl = new AbortController()
    fetch(`/api/people?q=${encodeURIComponent(q)}&limit=5`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setMentionResults(d.users ?? []))
      .catch(() => {})
    return () => ctrl.abort()
  }, [mentionQuery])

  const handleInput = (val: string) => {
    setText(val)
    const cursorPos = textareaRef.current?.selectionStart ?? val.length
    const before = val.slice(0, cursorPos)
    const mentionMatch = before.match(/@(\w*)$/)
    setMentionQuery(mentionMatch ? mentionMatch[1] : null)
  }

  const insertMention = (name: string) => {
    const cursorPos = textareaRef.current?.selectionStart ?? text.length
    const before = text.slice(0, cursorPos).replace(/@\w*$/, `@${name} `)
    const after = text.slice(cursorPos)
    setText(before + after)
    setMentionQuery(null)
    textareaRef.current?.focus()
  }

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      className={`social-compose ${focused ? 'focused' : ''}`}
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
        <div className="social-compose-input-wrap">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="What's happening in your world?"
            className="social-compose-input"
            rows={focused ? 3 : 1}
            maxLength={MAX_CHARS + 50}
          />

          {mentionQuery !== null && mentionResults.length > 0 && (
            <div className="social-mention-dropdown">
              {mentionResults.map((u: any) => (
                <button
                  key={u.user_id}
                  type="button"
                  className="social-mention-item"
                  onMouseDown={e => { e.preventDefault(); insertMention(u.name) }}
                >
                  {u.profile_image
                    ? <img src={u.profile_image} alt="" className="social-mention-avatar" />
                    : <div className="social-mention-avatar social-mention-avatar-text">{u.name?.charAt(0).toUpperCase()}</div>}
                  <div className="social-mention-info">
                    <span className="social-mention-name">{u.name}</span>
                    <span className="social-mention-role">{u.role}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="social-compose-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickImages} />
            <button
              className="social-compose-tool"
              type="button"
              title="Add image"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon size={17} />
            </button>
            <button
              className="social-compose-tool"
              type="button"
              title="Add emoji"
              onClick={() => setShowEmoji(v => !v)}
            >
              <Smile size={17} />
            </button>
            <button
              className="social-compose-tool"
              type="button"
              title="Add hashtag"
              onClick={() => setText(t => t + (t && !t.endsWith(' ') ? ' ' : '') + '#')}
            >
              <Hash size={17} />
            </button>
            {showEmoji && (
              <EmojiPicker
                onSelect={emoji => { setText(t => t + emoji); textareaRef.current?.focus() }}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="char-ring-wrap" title={`${charCount}/${MAX_CHARS}`}>
              <svg className="char-ring" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <circle
                  cx="16" cy="16" r="14" fill="none"
                  stroke={overLimit ? 'var(--error)' : nearLimit ? 'var(--accent)' : 'var(--primary)'}
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  strokeLinecap="round"
                  transform="rotate(-90 16 16)"
                  style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                />
              </svg>
              {(nearLimit || overLimit) && (
                <span className="char-ring-count" style={{ color: overLimit ? 'var(--error)' : 'var(--accent)' }}>
                  {MAX_CHARS - charCount}
                </span>
              )}
            </div>
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
              {posting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="social-post-spinner" /> Posting
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Send size={14} /> Post
                </span>
              )}
            </button>
          </div>
        </div>

        {images.length > 0 && (
          <div className="social-compose-images">
            {images.map((url, i) => (
              <div key={i} className="social-compose-image">
                <img src={url} alt="" />
                <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} aria-label="Remove">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="social-compose-error" role="alert">{error}</p>}

        {focused && (
          <div className="social-compose-hint">
            <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to post
          </div>
        )}
      </div>
    </div>
  )
}

function Suggestions() {
  const { suggestions, loading } = useFollowSuggestions()
  const { data: profile } = useProfile(undefined)
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
            <FollowButton userId={s.user_id} currentUserId={profile?.user_id} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SocialPage() {
  const [tab, setTab] = useState<'home' | 'following' | 'saved'>('home')
  const feed = usePosts(tab)
  const { posts, loading, loadMore, hasMore, loadingMore, toggleLike, refetch } = feed
  const [openPostId, setOpenPostId] = useState<number | null>(null)
  const [newPostCount, setNewPostCount] = useState(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const initialLoadDone = useRef(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const prevPostCountRef = useRef(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pid = Number(params.get('post'))
    if (pid) setOpenPostId(pid)
  }, [])

  useEffect(() => {
    if (loading || initialLoadDone.current) return
    if (posts.length > 0) initialLoadDone.current = true
  }, [loading, posts.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || tab === 'saved') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore, tab])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setNewPostCount(0)
  }, [])

  useEffect(() => {
    if (loading) return
    const diff = posts.length - prevPostCountRef.current
    if (diff > 0 && initialLoadDone.current && window.scrollY > 300) {
      setNewPostCount(c => c + diff)
    }
    prevPostCountRef.current = posts.length
  }, [posts.length, loading])

  const handleDelete = useCallback(async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (res.ok) refetch()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }, [refetch])

  const handleEdit = useCallback(async (postId: number, newContent: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })
      if (res.ok) refetch()
    } catch (err) {
      console.error('Edit failed:', err)
    }
  }, [refetch])

  const handleHide = useCallback(async (postId: number) => {
    if (!confirm('Hide this post?')) return
    try {
      const res = await fetch(`/api/posts/${postId}/hide`, { method: 'POST' })
      if (res.ok) refetch()
    } catch (err) {
      console.error('Hide failed:', err)
    }
  }, [refetch])

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

          <div className="social-feed" ref={feedRef}>
            {newPostCount > 0 && (
              <button className="social-new-posts-banner" onClick={scrollToTop}>
                <span className="social-new-posts-dot" />
                {newPostCount} new {newPostCount === 1 ? 'post' : 'posts'} — tap to see
              </button>
            )}
            {loading && posts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="social-skeleton">
                    <div className="social-skeleton-header">
                      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 7 }} />
                        <div className="skeleton" style={{ width: '25%', height: 10, borderRadius: 5 }} />
                      </div>
                    </div>
                    <div className="skeleton" style={{ width: '90%', height: 14, borderRadius: 7, marginTop: 12 }} />
                    <div className="skeleton" style={{ width: '70%', height: 14, borderRadius: 7 }} />
                    <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 12 }} />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="social-empty" style={{ animation: 'futr-fade-up 0.4s var(--ease-out-expo) both' }}>
                <div className="social-empty-icon">📝</div>
                <p className="social-empty-title">{tab === 'saved' ? 'No saved posts yet' : 'No posts yet'}</p>
                <p className="social-empty-sub">{tab === 'saved' ? 'Tap the bookmark on any post to save it here.' : 'Be the first to share something with the community!'}</p>
              </div>
            ) : (
              <>
                {posts.map((p, idx) => (
                  <div key={p.post_id}>
                    <PostCard post={p} onToggleLike={toggleLike} onOpen={setOpenPostId} onDelete={handleDelete} onEdit={handleEdit} onHide={handleHide} />
                    {idx === 2 && (
                      <SponsoredCard
                        adId="sidebar-1"
                        slot="feed"
                        title="026connect Premium"
                        body="Get exclusive access to premium content, analytics, and ad-free browsing. Join hundreds of writers already on the platform."
                        cta="Upgrade Now"
                        ctaUrl="/premium"
                      />
                    )}
                  </div>
                ))}
                {hasMore && tab !== 'saved' && (
                  <div ref={sentinelRef} className="social-scroll-sentinel">
                    {loadingMore && (
                      <div className="social-load-spinner">
                        <div className="social-spinner-dot" />
                        <div className="social-spinner-dot" />
                        <div className="social-spinner-dot" />
                      </div>
                    )}
                  </div>
                )}
                {!hasMore && posts.length > 0 && tab !== 'saved' && (
                  <div className="social-end-of-feed">
                    <span>You&apos;re all caught up</span>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <aside className="social-sidebar">
          <SponsoredCard
            adId="sidebar-ad-1"
            slot="sidebar"
            title="Write for 026connect!"
            body="Share your stories with thousands of readers. Earn revenue from your journalism."
            cta="Apply Now"
            ctaUrl="/apply"
          />

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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
