use 'client'

import Link from 'next/link'
import { useState, Fragment, useRef, useEffect } from 'react'
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, Edit2, Trash2, EyeOff, Flag } from 'lucide-react'
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
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const submitComment = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    await addComment(text)
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
      const url = `${window.location.origin}/social?post=${post.post_id}`
      try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
      setShareCount(c => c + 1)
    } finally {
      setSharing(false)
    }
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
          <Link href={`/journalists/${post.author?.user_id ?? ''}`} className="social-post-author">
            {post.author?.name ?? 'Unknown'}
          </Link>
          <span className="social-post-sub">
            @{post.author?.name?.toLowerCase().replace(/\s+/g, '') ?? 'user'} ·{' '}
            {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
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
            <div
              className="social-post-menu"
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 8,
                zIndex: 100,
                background: 'var(--bg-elevated)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 4,
                boxShadow: 'var(--shadow-lg)',
                minWidth: 160,
              }}
            >
              <button
                onClick={() => { setEditing(true); setShowMenu(false); }}
                className="social-menu-item"
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}
              >
                <Edit2 size={16} />
                Edit Post
              </button>
              {onHide && (
                <button
                  onClick={() => { onHide(post.post_id); setShowMenu(false); }}
                  className="social-menu-item"
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}
                >
                  <EyeOff size={16} />
                  Hide Post
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(post.post_id); setShowMenu(false); }}
                  className="social-menu-item"
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}
                >
                  <Trash2 size={16} />
                  Delete Post
                </button>
              )}
              <button
                onClick={() => { setShowMenu(false); }}
                className="social-menu-item"
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem' }}
              >
                <Flag size={16} />
                Report
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
            className="w-full p-3 rounded-xl text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--primary)', color: 'var(--text-primary)', outline: 'none', minHeight: 80, resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={() => { setEditing(false); setEditContent(post.content); }}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Cancel
            </button>
            <button
              onClick={() => { onEdit?.(post.post_id, editContent.trim()); setEditing(false); }}
              disabled={!editContent.trim()}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
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
          {renderContentWithLinks(post.content)}
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
          {post.tags.map(t => (
            <span key={t} className="social-tag" style={{ transition: 'all 0.2s var(--ease-out-expo)', padding: '2px 6px', borderRadius: 6, background: 'var(--primary-light)', fontSize: '0.78rem' }}>#{t}</span>
          ))}
        </div>
      )}

      <div className="social-post-actions">
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
        <button
          className="social-action"
          onClick={share}
          style={{
            transition: 'all 0.25s var(--ease-out-expo)',
            transform: sharing ? 'scale(0.9)' : 'scale(1)',
          }}
        >
          <Share2 size={18} style={{ transition: 'transform 0.3s var(--ease-out-expo)', transform: sharing ? 'rotate(180deg)' : 'rotate(0)' }} />
          <span>{shareCount}</span>
        </button>
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