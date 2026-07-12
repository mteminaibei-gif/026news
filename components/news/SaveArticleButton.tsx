'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { useUser } from '@/lib/hooks/useAuth'

interface Props {
  articleId: number
  slug: string
}

export function SaveArticleButton({ articleId, slug }: Props) {
  const router = useRouter()
  const { data: user, isLoading } = useUser()
  const [savedId, setSavedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    fetch('/api/saved-articles')
      .then(r => r.json())
      .then(d => {
        if (!active) return
        const found = (d.data ?? []).find((s: any) => s.article_id === articleId)
        if (found) setSavedId(found.saved_id)
      })
      .catch(() => {})
    return () => { active = false }
  }, [user, articleId])

  async function toggle() {
    if (!user) {
      router.push(`/login?redirect=/article/${slug}`)
      return
    }
    if (loading) return
    setLoading(true)
    try {
      if (savedId) {
        const res = await fetch('/api/saved-articles', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saved_id: savedId }),
        })
        if (res.ok) setSavedId(null)
      } else {
        const res = await fetch('/api/saved-articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ article_id: articleId }),
        })
        const data = await res.json()
        if (res.ok && data?.saved_id) {
          setSavedId(data.saved_id)
        } else if (res.status === 409) {
          const list = await (await fetch('/api/saved-articles')).json()
          const found = (list.data ?? []).find((s: any) => s.article_id === articleId)
          if (found) setSavedId(found.saved_id)
        }
      }
    } catch {
      /* no-op */
    } finally {
      setLoading(false)
    }
  }

  const saved = savedId !== null

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || isLoading}
      aria-pressed={saved}
      className="inline-flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-60"
      style={{
        background: saved ? 'var(--primary-light)' : 'var(--bg-surface)',
        border: '1px solid var(--border)',
        color: saved ? 'var(--primary)' : 'var(--text-primary)',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
    >
      <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
