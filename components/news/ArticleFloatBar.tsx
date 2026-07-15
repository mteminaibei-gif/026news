'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react'
import { useUser } from '@/lib/hooks/useAuth'
import { useLike } from '@/lib/hooks/useLike'

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

interface Props {
  articleId: number
  slug: string
  initialLikes?: number
  initialSaves?: number
  commentCount?: number
  variant?: 'float' | 'inline'
}

export function ArticleFloatBar({ articleId, slug, initialLikes = 0, initialSaves = 0, commentCount = 0, variant = 'float' }: Props) {
  const isInline = variant === 'inline'
  const router = useRouter()
  const { data: user } = useUser()
  const { liked, count: likeCount, toggle: toggleLike } = useLike(articleId, initialLikes, `/article/${slug}`)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    fetch('/api/saved-articles')
      .then(r => r.json())
      .then(d => {
        const f = (d.data ?? []).find((s: { article_id: number; saved_id: number }) => s.article_id === articleId)
        if (active && f) {
          setSavedId(f.saved_id)
          setSaved(true)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [user, articleId])

  const saveCount = initialSaves + (saved ? 1 : 0)

  const toggleSave = async () => {
    if (!user) {
      router.push(`/login?redirect=/article/${slug}`)
      return
    }
    if (busy) return
    setBusy(true)
    try {
      if (savedId) {
        const res = await fetch('/api/saved-articles', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saved_id: savedId }),
        })
        if (res.ok) {
          setSavedId(null)
          setSaved(false)
        }
      } else {
        const res = await fetch('/api/saved-articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_id: articleId }),
        })
        const data = await res.json()
        if (res.ok && data?.saved_id) {
          setSavedId(data.saved_id)
          setSaved(true)
        }
      }
    } catch {
      /* no-op */
    } finally {
      setBusy(false)
    }
  }

  const scrollToComments = () => {
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })
  }

  const share = async () => {
    const url = `${window.location.origin}/article/${slug}`
    // Increment share count
    fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: articleId }),
    }).catch(() => {})
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: document.title, url })
        return
      } catch {
        return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={isInline ? 'inline-bar' : 'float-bar'}>
      <button className={`float-btn ${liked ? 'active' : ''}`} onClick={toggleLike} aria-label="Like article">
        <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
        {isInline && <span>Like</span>}
        <span className="float-btn-count">{compact(likeCount)}</span>
      </button>
      <button className="float-btn" onClick={scrollToComments} aria-label="View comments">
        <MessageCircle size={20} />
        {isInline && <span>Comment</span>}
        <span className="float-btn-count">{compact(commentCount)}</span>
      </button>
      <div className="float-divider" />
      <button className={`float-btn ${saved ? 'saved' : ''}`} onClick={toggleSave} disabled={busy} aria-label="Save article">
        <Bookmark size={20} fill={saved ? 'currentColor' : 'none'} />
        {isInline && <span>Save</span>}
        <span className="float-btn-count">{compact(saveCount)}</span>
      </button>
      <button className="float-btn" onClick={share} aria-label="Share article">
        <Share2 size={20} />
        {isInline && <span>{copied ? 'Copied!' : 'Share'}</span>}
      </button>
    </div>
  )
}
