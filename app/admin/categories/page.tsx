'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { FolderPlus, Trash2, Check, ArrowLeft, Smile, X, Loader2 } from 'lucide-react'

// Common emoji icons for categories
const CATEGORY_ICONS = [
  '🏛️', '💼', '💻', '🔬', '🎬', '⚽', '✍️', '🏥', '🎓', '🌾',
  '🏠', '🗞️', '📺', '📻', '🎵', '🎨', '📚', '🔬', '⚖️', '🌍',
  '🏗️', '💰', '📈', '🚀', '🤖', '🔒', '☁️', '📱', '🎮', '🎧',
  '🚗', '✈️', '🚢', '🏛️', '⚡', '💡', '📊', '📝', '📷', '🎥',
  '🏥', '💊', '🧬', '🧪', '🦠', '🌱', '🌳', '🌊', '🔥', '❄️',
]

interface Category { category_id: number; name: string; description: string | null; icon: string | null }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newIcon, setNewIcon] = useState('📁')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  // Real-time updates: refetch whenever a category is inserted/updated/deleted.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategories()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadCategories() {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!newName.trim()) { setError('Name is required'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim(), icon: newIcon }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create'); return }
      setSuccess(`"${data.name}" created`)
      setNewName('')
      setNewDesc('')
      setNewIcon('📁')
      loadCategories()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Network error') }
    setCreating(false)
  }

  async function handleDelete(id: number, name: string) {
    setPendingDelete({ id, name })
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setConfirmOpen(false)
    const { id, name } = pendingDelete
    setPendingDelete(null)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return }
      setSuccess(`"${name}" deleted`)
      loadCategories()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Network error') }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="px-4 py-4" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/admin/articles" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={14} /> Back to Articles
        </Link>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Manage Categories
          </h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--success)' }} />
            </span>
            Live
          </span>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Add New Category</h2>
          {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>{error}</div>}
          {success && <div className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><Check size={14} /> {success}</div>}
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Category name"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              maxLength={50}
            />
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              maxLength={200}
            />
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Icon</label>
            <div className="flex flex-wrap gap-1.5" style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {CATEGORY_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewIcon(icon)}
                  className={`w-8 h-8 rounded-xl text-xl flex items-center justify-center transition-all ${
                    newIcon === icon
                      ? 'ring-2 ring-offset-2'
                      : 'hover:bg-opacity-10'
                  }`}
                  style={{
                    border: '1px solid var(--border)',
                    background: newIcon === icon ? 'var(--primary-light)' : 'var(--bg-elevated)',
                    color: newIcon === icon ? 'var(--primary)' : 'var(--text-primary)',
                    boxShadow: newIcon === icon ? '0 0 0 2px var(--primary)' : undefined,
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            style={{ background: 'var(--primary)', color: '#fff', cursor: 'pointer', border: 'none' }}
          >
            <FolderPlus size={14} />
            {creating ? 'Creating...' : 'Add Category'}
          </button>
        </form>

        {/* Category list */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No categories yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-muted)' }}>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>Icon</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>Description</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.category_id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3 text-center text-2xl">{cat.icon || '📁'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{cat.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{cat.description || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(cat.category_id, cat.name)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: 'var(--error-light)', color: 'var(--error)', cursor: 'pointer', border: 'none' }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={`Delete "${pendingDelete?.name}"?`}
        message="Articles using this category will become uncategorized. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setPendingDelete(null) }}
      />
    </div>
  )
}
