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
  const [editing, setEditing] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editIcon, setEditIcon] = useState('📁')
  const [savingEdit, setSavingEdit] = useState(false)

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
    setError('')
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' })
      if (!res.ok) {
        setError('Failed to load categories')
        setCategories([])
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) {
        setCategories(data)
      } else {
        setError('Invalid categories data format')
        setCategories([])
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
      setError(err instanceof Error ? err.message : 'Network error')
      setCategories([])
    } finally {
      setLoading(false)
    }
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

  function openEdit(cat: Category) {
    setEditing(cat)
    setEditName(cat.name)
    setEditDesc(cat.description ?? '')
    setEditIcon(cat.icon || '📁')
    setError('')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setError('')
    if (!editName.trim()) { setError('Name is required'); return }
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/categories?id=${editing.category_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim(), icon: editIcon }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to update'); return }
      setSuccess(`"${data.name}" updated`)
      setEditing(null)
      loadCategories()
      setTimeout(() => setSuccess(''), 3000)
    } catch { setError('Network error') }
    setSavingEdit(false)
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
          {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>⚠️ {error}</div>}
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
            <div className="overflow-x-auto">
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
<td className="px-4 py-3 text-center text-2xl">
                      <div className="flex items-center justify-center gap-1">
                        {cat.icon || '📁'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{cat.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{cat.description || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: 'var(--primary-light)', color: 'var(--primary)', cursor: 'pointer', border: 'none' }}
                        >
                          <Check size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.category_id, cat.name)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: 'var(--error-light)', color: 'var(--error)', cursor: 'pointer', border: 'none' }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditing(null)}
        >
          <form
            onSubmit={handleEdit}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Edit Category</h2>
              <button type="button" onClick={() => setEditing(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={18} /></button>
            </div>
            {error && <div className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>{error}</div>}
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Category name"
                className="rounded-xl px-4 py-2.5 text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                maxLength={50}
              />
              <input
                type="text"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                className="rounded-xl px-4 py-2.5 text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                maxLength={200}
              />
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Icon</label>
                <div className="flex flex-wrap gap-1.5" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  {CATEGORY_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setEditIcon(icon)}
                      className="w-8 h-8 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{
                        border: '1px solid var(--border)',
                        background: editIcon === icon ? 'var(--primary-light)' : 'var(--bg-elevated)',
                        color: editIcon === icon ? 'var(--primary)' : 'var(--text-primary)',
                        boxShadow: editIcon === icon ? '0 0 0 2px var(--primary)' : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={savingEdit || !editName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                style={{ background: 'var(--primary)', color: '#fff', cursor: 'pointer', border: 'none' }}
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

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
