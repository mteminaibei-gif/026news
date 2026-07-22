'use client'

import { useState, useEffect } from 'react'

type Tag = { tag_id: number; tag_name: string; tag_slug: string; usage_count: number }
type Category = { category_id: number; name: string; slug: string | null }

interface ArticleTagEditorProps {
  articleId: number
  currentTags: string[]
  currentCategoryId: number | null
  onSaved?: () => void
  onClose?: () => void
}

export function ArticleTagEditor({ articleId, currentTags, currentCategoryId, onSaved, onClose }: ArticleTagEditorProps) {
  const [tags, setTags] = useState<string[]>(currentTags || [])
  const [newTag, setNewTag] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(currentCategoryId)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/tags').then(r => r.json()),
      fetch('/api/admin/categories').then(r => r.json()).catch(() => []),
    ]).then(([tagsData, catsData]) => {
      setAllTags(Array.isArray(tagsData) ? tagsData : [])
      setCategories(Array.isArray(catsData) ? catsData : [])
    }).finally(() => setLoading(false))
  }, [])

  const addTag = (tagName: string) => {
    const t = tagName.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setNewTag('')
    }
  }

  const removeTag = (tagName: string) => {
    setTags(tags.filter(t => t !== tagName))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, tags }),
      })
      if (!res.ok) {
        const d = await res.json()
        setMessage({ type: 'error', text: d.error || 'Failed to save tags' })
        return
      }

      // Update category separately via PATCH
      if (categoryId !== currentCategoryId) {
        await fetch('/api/admin/articles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: articleId, category_id: categoryId }),
        })
      }

      setMessage({ type: 'success', text: 'Saved!' })
      setTimeout(() => { setMessage(null); onSaved?.() }, 1500)
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  const suggestedTags = allTags.filter(t => !tags.includes(t.tag_name)).slice(0, 10)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Edit Article</h3>
          {onClose && (
            <button onClick={onClose} className="text-2xl leading-none" style={{ color: 'var(--text-tertiary)' }}>&times;</button>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Category */}
          <div>
            <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>Category</label>
            <select
              value={categoryId ?? ''}
              onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">— No category —</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>Tags</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[...new Set(tags)].map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 opacity-60 hover:opacity-100">&times;</button>
                </span>
              ))}
              {tags.length === 0 && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No tags assigned</span>}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(newTag) } }}
                placeholder="Type a tag and press Enter"
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Suggested tags */}
          {suggestedTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>Suggested tags:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTags.map(t => (
                  <button
                    key={t.tag_id}
                    onClick={() => addTag(t.tag_name)}
                    className="px-2.5 py-1 rounded-full text-xs transition-colors hover:opacity-80"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    + {t.tag_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {message && (
            <div className="px-4 py-2 rounded-lg text-sm font-semibold" style={{
              background: message.type === 'success' ? 'var(--success-light)' : 'var(--error-light)',
              color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
            }}>
              {message.text}
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {onClose && (
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
