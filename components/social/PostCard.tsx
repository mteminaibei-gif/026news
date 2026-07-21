'use client'

import Link from 'next/link'
import { useState, Fragment } from 'react'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark } from 'lucide-react'
import type { SocialPost, SocialComment } from '@/lib/hooks/usePosts'
import { usePostComments } from '@/lib/hooks/usePosts'
import { formatDistanceToNow } from 'date-fns'

const URL_RE = /(https?:\/\/[^\s]+)/g

function renderContentWithLinks(text: string) {
  const parts = text.split(URL_RE)
  return parts.map((part, i) => {
    if (URL_RE.test(part)) {
      return <Link key={i} href={part} target="_blank" rel="noopener noreferrer" className="social-link" onClick={e => e.stopPropagation()}>{part}</Link>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) return <img src={src} alt={name} className="social-avatar-img" />
  return <div className="social-avatar">{name.charAt(0).toUpperCase()}</div>
}

export function PostCard({ post, onToggleLike, onOpen }: {
  post: SocialPost
  onToggleLike: (id: number) => void
  onOpen?: (id: number) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const { comments, addComment, loading: loadingComments } = usePostComments(showComments ? post.post_id : null)
  const [draft, setDraft] = useState('')
  const [liked, setLiked] = useState(!!post.liked)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [saved, setSaved] = useState(!!post.saved)
  const [shareCount, setShareCount] = useState(post.share_count ?? 0)

  const submitComment = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    await addComment(text)
  }

  const [sharing, setSharing] = useState(false)
  const share = async () => {
    if (sharing) return
    setSharing(true)
    try {
      await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.post_id }),
      })
      const url = `${window.location.origin}/social?post=${post.post_id}`
      try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
      setShareCount(c => c + 1)
    } finally {
      setSharing(false)
    }
  }

  const [saving, setSaving] = useState(false)
  const toggleSave = async () => {
    if (saving) return
    setSaving(true)
    setSaved(s => !s)
    try {
      const res = await fetch(`/api/posts/${post.post_id}/save`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSaved(!!data.saved)
      }
    } catch {
      setSaved(s => !s)
    } finally {
      setSaving(false)
    }
  }

  const like = () => {
    setLiked(l => !l)
    setLikeCount(c => c + (liked ? -1 : 1))
    onToggleLike(post.post_id)
  }

  return (
    <article className="social-post">
      <header className="social-post-head">
        <Link href={`/journalists/${post.author?.user_id ?? ''}`} className="social-avatar-link">
          <Avatar src={post.author?.profile_image ?? null} name={post.author?.name ?? 'U'} />
        </Link>
        <div className="social-post-meta">
          <Link href={`/journalists/${post.author?.user_id ?? ''}`} className="social-post-author">
            {post.author?.name ?? 'Unknown'}
          </Link>
          <span className="social-post-sub">
            @{post.author?.name?.toLowerCase().replace(/\s+/g, '') ?? 'user'} ·{' '}
            {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
          </span>
        </div>
        <button className="social-icon-btn" aria-label="More"><MoreHorizontal size={18} /></button>
      </header>

      <p className="social-post-content" onClick={() => onOpen?.(post.post_id)} style={{ cursor: onOpen ? 'pointer' : undefined }}>
        {renderContentWithLinks(post.content)}
      </p>

      {post.image_urls && post.image_urls.length > 0 && (
        <div className={`social-post-images count-${Math.min(post.image_urls.length, 4)}`}>
          {post.image_urls.slice(0, 4).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" className="social-post-image" />
          ))}
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="social-post-tags">
          {post.tags.map(t => (
            <span key={t} className="social-tag">#{t}</span>
          ))}
        </div>
      )}

      <div className="social-post-actions">
        <button
          className={`social-action ${liked ? 'liked' : ''}`}
          onClick={like}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          <span>{likeCount}</span>
        </button>
        <button className="social-action" onClick={() => setShowComments(v => !v)}>
          <MessageCircle size={18} />
          <span>{post.comment_count}</span>
        </button>
        <button className={`social-action ${saved ? 'saved' : ''}`} onClick={toggleSave}>
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <button className="social-action" onClick={share}>
          <Share2 size={18} />
          <span>{shareCount}</span>
        </button>
      </div>

      {showComments && (
        <div className="social-comments">
          {loadingComments && <p className="social-comments-loading">Loading comments…</p>}
          {comments.map(c => (
            <div key={c.comment_id} className="social-comment">
              <Avatar src={c.author?.profile_image ?? null} name={c.author?.name ?? 'U'} />
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
              onKeyDown={e => { if (e.key === 'Enter') submitComment() }}
              placeholder="Write a comment…"
              className="social-comment-input"
            />
            <button onClick={submitComment} className="social-send-btn" aria-label="Send"><Send size={16} /></button>
          </div>
        </div>
      )}
    </article>
  )
}
