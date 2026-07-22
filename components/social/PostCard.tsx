'use client'

import Link from 'next/link'
import { useState, Fragment, useRef, useEffect } from 'react'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, Edit2, Trash2, EyeOff, Flag, ExternalLink } from 'lucide-react'
import type { SocialPost, SocialComment } from '@/lib/hooks/usePosts'
import { usePostComments } from '@/lib/hooks/usePosts'
import { formatDistanceToNow } from 'date-fns'

const URL_RE = /(https?:\/\/[^\s]+)/g

function renderContentWithLinks(text: string) {
  const parts = text.split(URL_RE)
  return parts.map((part, i) => {
    if (URL_RE.test(part)) {
      return <Link key={i} href={part} target="_blank" rel="noopener noreferrer" className="social-link" onClick={e => e.stopPropagation()}>{part.length > 40 ? part.slice(0, 37) + '…' : part}</Link>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

function renderHashtags(text: string) {
  const parts = text.split(/(#\w+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return <span key={i} className="social-tag-inline">{part}</span>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

function renderContent(text: string) {
  const parts = text.split(URL_RE)
  return parts.map((part, i) => {
    if (URL_RE.test(part)) {
      return <Link key={i} href={part} target="_blank" rel="noopener noreferrer" className="social-link" onClick={e => e.stopPropagation()}>{part.length > 40 ? part.slice(0, 37) + '…' : part}</Link>
    }
    const tagged = part.split(/(#\w+)/g)
    return <Fragment key={i}>{tagged.map((t, j) => t.startsWith('#') ? <span key={`${i}-${j}`} className="social-tag-inline">{t}</span> : t)}</Fragment>
  })
}

function estimateReadTime(text: string): string {
  const words = text.split(/\s+/).length
  const mins = Math.max(1, Math.ceil(words / 200))
  return `${mins} min read`
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) return (
    <img
      src={src}
      alt={name}
      className="social-avatar-img"
      style={{
        transition: 'transform 0.2s var(--ease-out-expo)',
      }}
    />
  )
  return <div className="social-avatar">{name.charAt(0).toUpperCase()}</div>
}

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '👏', '😮', '💯']

export function PostCard({ post, onToggleLike, onOpen, onDelete, onEdit, onHide }: {
  post: SocialPost
  onToggleLike: (id: number) => void
  onOpen?: (id: number) => void
  onDelete?: (id: number) => void
  onEdit?: (postId: number, newContent: string) => void
  onHide?: (id: number) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const { comments, addComment, loading: loadingComments } = usePostComments(showComments ? post.post_id : null)
  const [draft, setDraft] = useState('')
  const [liked, setLiked] = useState(!!post.liked)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [saved, setSaved] = useState(!!post.saved)
  const [shareCount, setShareCount] = useState(post.share_count ?? 0)
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const menuRef = useRef<HTMLDivElement>(null)
  const reactionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
        setShowShareMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const submitComment = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    const ok = await addComment(text)
    if (!ok) setDraft(text)
  }

  const share = async () => {
    if (sharing) return
    setSharing(true)
    try {
      await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.post_id }),
      })
      setShareCount(c => c + 1)
    } finally {
      setSharing(false)
    }
  }

  const copyLink = async () => {
    const url = `${window.location.origin}/social?post=${post.post_id}`
    try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
    setShowShareMenu(false)
  }

  const nativeShare = async () => {
    const url = `${window.location.origin}/social?post=${post.post_id}`
    if (navigator.share) {
      try { await navigator.share({ title: `${post.author?.name}'s post`, text: post.content.slice(0, 120), url }) } catch { /* ignore */ }
    } else {
      copyLink()
    }
    setShowShareMenu(false)
  }

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
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 400)
    onToggleLike(post.post_id)
  }

  return (
    <article
      className="social-post"
      style={{ animation: 'futr-fade-up 0.5s var(--ease-out-expo) both', position: 'relative' }}
    >
      <header className="social-post-head">
        <Link href={`/journalists/${post.author?.user_id ?? ''}`} className="social-avatar-link">
          <Avatar src={post.author?.profile_image ?? null} name={post.author?.name ?? 'U'} />
        </Link>
        <div className="social-post-meta">
          <div className="social-post-meta-row">
            <Link href={`/journalists/${post.author?.user_id ?? ''}`} className="social-post-author">
              {post.author?.name ?? 'Unknown'}
            </Link>
            {post.author?.role === 'journalist' && (
              <span className="social-badge">Writer</span>
            )}
          </div>
          <span className="social-post-sub">
            @{post.author?.name?.toLowerCase().replace(/\s+/g, '') ?? 'user'} ·{' '}
            {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
            <span className="social-post-dot">·</span>
            <span className="social-read-time">{estimateReadTime(post.content)}</span>
          </span>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            className="social-icon-btn"
            aria-label="More"
            onClick={(e) => { e.stopPropagation(); setShowMenu(v => !v); }}
            style={{ transition: 'all 0.2s var(--ease-out-expo)' }}
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <div className="social-post-menu">
              <button onClick={() => { setEditing(true); setShowMenu(false); }} className="social-menu-item">
                <Edit2 size={15} /> Edit Post
              </button>
              {onHide && (
                <button onClick={() => { onHide(post.post_id); setShowMenu(false); }} className="social-menu-item social-menu-item-secondary">
                  <EyeOff size={15} /> Hide Post
                </button>
              )}
              {onDelete && (
                <button onClick={() => { onDelete(post.post_id); setShowMenu(false); }} className="social-menu-item social-menu-item-danger">
                  <Trash2 size={15} /> Delete Post
                </button>
              )}
              <button onClick={() => { setShowMenu(false); }} className="social-menu-item social-menu-item-muted">
                <Flag size={15} /> Report
              </button>
            </div>
          )}
        </div>
      </header>

      {editing ? (
        <div style={{ marginBlock: 12 }}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="social-compose-input"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--primary)', color: 'var(--text-primary)', outline: 'none', minHeight: 80, resize: 'vertical', padding: 12, borderRadius: 12, width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={() => { setEditing(false); setEditContent(post.content); }}
              className="social-btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={() => { onEdit?.(post.post_id, editContent.trim()); setEditing(false); }}
              disabled={!editContent.trim()}
              className="social-btn-primary"
            >
              Save Edit
            </button>
          </div>
        </div>
      ) : (
        <p
          className="social-post-content"
          onClick={() => onOpen?.(post.post_id)}
          style={{
            cursor: onOpen ? 'pointer' : undefined,
            transition: 'color 0.2s',
          }}
        >
          {renderContent(post.content)}
        </p>
      )}

      {post.image_urls && post.image_urls.length > 0 && (
        <div className={`social-post-images count-${Math.min(post.image_urls.length, 4)}`}>
          {post.image_urls.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="social-post-image" style={{ transition: 'transform 0.4s var(--ease-out-expo)' }} />
          ))}
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="social-post-tags">
          {[...new Set(post.tags)].map(t => (
            <span key={t} className="social-tag">#{t}</span>
          ))}
        </div>
      )}

      <div className="social-post-actions">
        <div
          className="social-reaction-wrap"
          onMouseEnter={() => { if (reactionTimeout.current) clearTimeout(reactionTimeout.current); setShowReactions(true) }}
          onMouseLeave={() => { reactionTimeout.current = setTimeout(() => setShowReactions(false), 300) }}
        >
          <button
            className={`social-action ${liked ? 'liked' : ''}`}
            onClick={like}
            style={{
              transition: 'all 0.25s var(--ease-out-expo)',
              transform: likeAnimating ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            <Heart
              size={18}
              fill={liked ? 'currentColor' : 'none'}
              style={{
                transition: 'all 0.25s var(--ease-out-expo)',
                filter: liked ? 'drop-shadow(0 0 4px var(--error))' : undefined,
              }}
            />
            <span>{likeCount}</span>
          </button>
          {showReactions && (
            <div className="social-reaction-bar">
              {QUICK_REACTIONS.map(r => (
                <button
                  key={r}
                  className="social-reaction-emoji"
                  onClick={e => { e.stopPropagation(); like(); setShowReactions(false) }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="social-action"
          onClick={() => setShowComments(v => !v)}
          style={{
            transition: 'all 0.25s var(--ease-out-expo)',
            color: showComments ? 'var(--primary)' : undefined,
          }}
        >
          <MessageCircle size={18} />
          <span>{post.comment_count}</span>
        </button>

        <button
          className={`social-action ${saved ? 'saved' : ''}`}
          onClick={toggleSave}
          style={{
            transition: 'all 0.25s var(--ease-out-expo)',
            transform: saving ? 'scale(0.9)' : 'scale(1)',
          }}
        >
          <Bookmark
            size={18}
            fill={saved ? 'currentColor' : 'none'}
            style={{
              transition: 'all 0.25s var(--ease-out-expo)',
              filter: saved ? 'drop-shadow(0 0 4px var(--primary))' : undefined,
            }}
          />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            className="social-action"
            onClick={() => setShowShareMenu(v => !v)}
            style={{
              transition: 'all 0.25s var(--ease-out-expo)',
              transform: sharing ? 'scale(0.9)' : 'scale(1)',
            }}
          >
            <Share2 size={18} style={{ transition: 'transform 0.3s var(--ease-out-expo)', transform: sharing ? 'rotate(180deg)' : 'rotate(0)' }} />
            <span>{shareCount}</span>
          </button>
          {showShareMenu && (
            <div className="social-post-menu social-share-menu">
              <button onClick={copyLink} className="social-menu-item">
                <ExternalLink size={15} /> Copy link
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button onClick={nativeShare} className="social-menu-item">
                  <Share2 size={15} /> Share
                </button>
              )}
              <button onClick={share} className="social-menu-item">
                <Bookmark size={15} /> Repost
              </button>
            </div>
          )}
        </div>
      </div>

      {showComments && (
        <div className="social-comments" style={{ animation: 'futr-fade-up 0.3s var(--ease-out-expo) both' }}>
          {loadingComments && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: 120, height: 28, borderRadius: 14 }} />
            </div>
          )}
          {comments.map(c => (
            <div key={c.comment_id} className="social-comment" style={{ animation: 'futr-fade-up 0.3s var(--ease-out-expo) both' }}>
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
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitComment() }}
              placeholder="Write a comment…"
              className="social-comment-input"
              style={{ transition: 'all 0.25s var(--ease-out-expo)' }}
            />
            <button onClick={submitComment} className="social-send-btn" aria-label="Send" style={{ transition: 'all 0.25s var(--ease-out-expo)' }}><Send size={16} /></button>
          </div>
        </div>
      )}
    </article>
  )
}
