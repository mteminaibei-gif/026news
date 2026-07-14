'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag, X } from 'lucide-react'

const CATEGORIES = [
  { id: 1, name: 'Politics' },
  { id: 2, name: 'Business' },
  { id: 3, name: 'Technology' },
  { id: 4, name: 'Sports' },
  { id: 5, name: 'Entertainment' },
  { id: 6, name: 'Health' },
  { id: 7, name: 'Science' },
  { id: 8, name: 'Kenya' },
  { id: 9, name: 'Africa' },
]

interface Props {
  articleId: number
  currentTags: string[]
  currentCategoryId: number | null
}

export function AdminArticleEditTags({ articleId, currentTags, currentCategoryId }: Props) {
  const [open, setOpen] = useState(false)
  const [tags, setTags] = useState<string[]>(currentTags)
  const [categoryId, setCategoryId] = useState<number | null>(currentCategoryId)
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase
        .from('articles')
        .update({ tags, category_id: categoryId } as never)
        .eq('article_id', articleId)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      /* ignore */
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
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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
