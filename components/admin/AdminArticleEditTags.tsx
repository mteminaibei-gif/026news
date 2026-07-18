'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCategories } from '@/lib/hooks/useCategories'
import { Tag, X } from 'lucide-react'

interface Props {
  articleId: number
  currentTags: string[]
  currentCategoryId: number | null
}

export function AdminArticleEditTags({ articleId, currentTags, currentCategoryId }: Props) {
  const [open, setOpen] = useState(false)
  const { categories } = useCategories()
  const [tags, setTags] = useState<string[]>(currentTags)
  const [categoryId, setCategoryId] = useState<number | null>(currentCategoryId)
  const [newTag, setNewTag] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [creatingCat, setCreatingCat] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setTags(currentTags)
      setCategoryId(currentCategoryId)
    }
  }, [open, currentTags, currentCategoryId])

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: saveError } = await supabase
        .from('articles')
        .update({ tags, category_id: categoryId } as never)
        .eq('article_id', articleId)
      if (saveError) throw saveError
      setSaved(true)
      setTimeout(() => { setSaved(false); setOpen(false) }, 1500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function addTag() {
    const t = newTag.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setNewTag('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  async function createCategory() {
    const name = newCategory.trim()
    if (!name || creatingCat) return
    setCreatingCat(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const cat = await res.json() as { category_id: number; name: string }
        setCategoryId(cat.category_id)
        setNewCategory('')
      }
    } catch {
      /* no-op */
    } finally {
      setCreatingCat(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-200"
        style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}
        title="Edit tags & category"
      >
        <Tag size={12} className="inline mr-1" />
        Tags
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="rounded-2xl p-6 w-full max-w-md shadow-xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Edit Article Tags & Category</h3>
          <button onClick={() => setOpen(false)} style={{ color: 'var(--text-tertiary)', cursor: 'pointer', background: 'none', border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        {/* Category */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category</label>
          <select
            value={categoryId ?? ''}
            onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
          >
            <option value="">No category</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.name}</option>
            ))}
          </select>
          {/* Create a new category on the fly (appears instantly via realtime) */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createCategory() } }}
              placeholder="New category name..."
              className="flex-1 rounded-lg px-3 py-1.5 text-xs"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={createCategory}
              disabled={creatingCat}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              + Add
            </button>
          </div>
          {categories.length === 0 && (
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>No categories yet — create one above.</p>
          )}
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
              >
                {tag}
                <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0, display: 'flex' }}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Add a tag..."
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={addTag}
              className="px-3 py-2 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'var(--primary)', color: '#fff', opacity: saving ? 0.6 : 1, cursor: 'pointer', border: 'none' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Saved!</span>}
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold ml-auto"
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
