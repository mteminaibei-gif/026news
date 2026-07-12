'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type FeedRow = {
  feed_id:      number
  name:         string
  feed_url:     string
  is_active:    boolean
  last_fetched: string | null
  last_error:   string | null
  fetch_count:  number
  category:     { name: string } | null
}

type Category = { category_id: number; name: string }

interface Props {
  feeds:      FeedRow[]
  categories: Category[]
}

export function AdminSourcesClient({ feeds: initialFeeds, categories }: Props) {
  const router = useRouter()

  const [feeds, setFeeds]             = useState<FeedRow[]>(initialFeeds)
  const [running, setRunning]         = useState(false)
  const [fetchResult, setFetchResult] = useState<string | null>(null)

  const [showAdd, setShowAdd]         = useState(false)
  const [addName, setAddName]         = useState('')
  const [addUrl, setAddUrl]           = useState('')
  const [addCatId, setAddCatId]       = useState<number | ''>('')
  const [addError, setAddError]       = useState('')
  const [addLoading, setAddLoading]   = useState(false)

  const [togglingId, setTogglingId]   = useState<number | null>(null)
  const [deletingId, setDeletingId]   = useState<number | null>(null)

  const [search, setSearch]                   = useState('')
  const [filterStatus, setFilterStatus]       = useState<'all' | 'active' | 'inactive'>('all')

  async function runFetchAll() {
    setRunning(true)
    setFetchResult(null)
    try {
      // Use the admin endpoint (authenticated) rather than the cron endpoint,
      // which is guarded by CRON_SECRET and returns 401 without a Bearer token.
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res  = await fetch('/api/admin/fetch-feeds', { method: 'POST', headers })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data) {
        setFetchResult(`❌ Fetch failed (${res.status}) — check server logs.`)
      } else {
        const feeds    = data.feeds ?? 0
        const inserted = data.inserted ?? 0
        const skipped  = data.skipped ?? 0
        const errors   = data.errors ?? 0
        setFetchResult(
          `✅ Done — ${inserted} inserted, ${skipped} skipped` +
          (errors ? `, ${errors} errors` : '') +
          ` across ${feeds} feeds.`
        )
      }
      router.refresh()
    } catch {
      setFetchResult('❌ Fetch failed — check server logs.')
    } finally {
      setRunning(false)
    }
  }

  async function toggleFeed(feed: FeedRow) {
    setTogglingId(feed.feed_id)
    try {
      const res = await fetch('/api/admin/sources', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ feed_id: feed.feed_id, is_active: !feed.is_active }),
      })
      if (res.ok) {
        setFeeds(prev => prev.map(f => f.feed_id === feed.feed_id ? { ...f, is_active: !f.is_active } : f))
      }
    } finally {
      setTogglingId(null)
    }
  }

  async function deleteFeed(feed: FeedRow) {
    if (!confirm(`Delete feed "${feed.name}"? This cannot be undone.`)) return
    setDeletingId(feed.feed_id)
    try {
      const res = await fetch(`/api/admin/sources?id=${feed.feed_id}`, { method: 'DELETE' })
      if (res.ok) setFeeds(prev => prev.filter(f => f.feed_id !== feed.feed_id))
    } finally {
      setDeletingId(null)
    }
  }

  async function addFeed(e: React.FormEvent) {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)
    try {
      const res = await fetch('/api/admin/sources', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:        addName.trim(),
          feed_url:    addUrl.trim(),
          category_id: addCatId !== '' ? Number(addCatId) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setAddError(data.error ?? 'Failed to add feed.'); return }

      const cat = categories.find(c => c.category_id === Number(addCatId)) ?? null
      setFeeds(prev => [{
        feed_id: data.feed_id, name: addName.trim(), feed_url: addUrl.trim(),
        is_active: true, last_fetched: null, last_error: null, fetch_count: 0,
        category: cat ? { name: cat.name } : null,
      }, ...prev])
      setAddName(''); setAddUrl(''); setAddCatId(''); setShowAdd(false)
    } finally {
      setAddLoading(false)
    }
  }

  const visible = feeds.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                        f.feed_url.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' ||
                        (filterStatus === 'active' && f.is_active) ||
                        (filterStatus === 'inactive' && !f.is_active)
    return matchSearch && matchStatus
  })

  const active     = feeds.filter(f => f.is_active).length
  const totalFetch = feeds.reduce((s, f) => s + (f.fetch_count ?? 0), 0)

  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Feeds',   value: feeds.length,                    style: { color: 'var(--primary)' } },
          { label: 'Active',        value: active,                          style: { color: 'var(--primary)' } },
          { label: 'Inactive',      value: feeds.length - active,           style: { color: 'var(--text-tertiary)' } },
          { label: 'Total Fetches', value: totalFetch.toLocaleString(),     style: { color: 'var(--warning)' } },
        ].map(s => (
          <div key={s.label} className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm text-center transition-all duration-300 hover:shadow-md" style={{ borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div className="text-2xl font-extrabold" style={s.style}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 className="font-bold" style={{ color: 'var(--primary)' }}>RSS Feed Sources</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Auto-fetched daily via Vercel Cron.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {fetchResult && <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: 'var(--text-secondary)', background: 'var(--primary-light)' }}>{fetchResult}</span>}
          <button
            onClick={() => setShowAdd(true)}
            className="text-white font-bold px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            style={{ background: 'var(--primary)' }}
          >
            + Add Feed
          </button>
          <button
            onClick={runFetchAll}
            disabled={running}
            className="font-bold px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:shadow-md disabled:opacity-50"
            style={{ background: 'var(--warning)', color: 'var(--text-primary)' }}
          >
            {running ? '⏳ Fetching…' : '⚡ Fetch All Now'}
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or URL…"
          className="border rounded-xl px-3 py-2 text-sm outline-none flex-1 min-w-[200px] transition-all duration-300"
          style={{ borderColor: 'var(--border-subtle)', ['--tw-ring-color' as string]: 'var(--success)' }}
        />
        <div className="flex gap-1">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300`}
              style={{
                background: filterStatus === s ? 'var(--primary)' : 'var(--primary-light)',
                color: filterStatus === s ? 'white' : 'var(--text-secondary)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md" style={{ borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <th className="px-4 py-2.5 text-left">Source</th>
                <th className="px-4 py-2.5 text-left">Feed URL</th>
                <th className="px-4 py-2.5 text-left">Category</th>
                <th className="px-4 py-2.5 text-left">Last Fetched</th>
                <th className="px-4 py-2.5 text-left">Fetches</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 text-left">Error</th>
                <th className="px-4 py-2.5 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--primary-light)' }}>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No feeds match your search.</td>
                </tr>
              ) : visible.map(f => (
                <tr key={f.feed_id} className="transition-all duration-300" style={{ ['--hover-bg' as string]: 'var(--bg-inset)' }}>
                  <td className="px-4 py-3 font-semibold text-gray-900 max-w-[160px]">
                    <span className="line-clamp-1">{f.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={f.feed_url} target="_blank" rel="noopener noreferrer"
                      className="hover:underline text-xs truncate max-w-[200px] block"
                      style={{ color: 'var(--primary)' }}>
                      {f.feed_url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {f.last_fetched ? formatDate(f.last_fetched) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(f.fetch_count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: f.is_active ? 'var(--border-subtle)' : 'var(--border)',
                        color: f.is_active ? 'var(--primary)' : 'var(--text-tertiary)',
                      }}>
                      {f.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[140px]" style={{ color: 'var(--error)' }}>
                    <span className="line-clamp-1">{f.last_error ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => toggleFeed(f)}
                        disabled={togglingId === f.feed_id}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300 disabled:opacity-50"
                        style={{
                          background: f.is_active ? 'var(--primary-light)' : 'var(--border-subtle)',
                          color: f.is_active ? 'var(--text-secondary)' : 'var(--primary)',
                        }}
                      >
                        {togglingId === f.feed_id ? '…' : f.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteFeed(f)}
                        disabled={deletingId === f.feed_id}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300 disabled:opacity-50"
                        style={{ background: 'var(--error-light)', color: 'var(--error)' }}
                      >
                        {deletingId === f.feed_id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Feed Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} />
                <h3 className="text-base font-extrabold" style={{ color: 'var(--primary)' }}>Add RSS Feed</h3>
              </div>
              <button onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-gray-600 w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all duration-300"
                aria-label="Close">✕</button>
            </div>

            {addError && (
              <div role="alert" className="text-sm px-3 py-2 rounded-xl mb-4" style={{ background: 'var(--error-light)', borderColor: 'var(--error)', border: '1px solid var(--error)', color: 'var(--error)' }}>
                {addError}
              </div>
            )}

            <form onSubmit={addFeed} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="add-name">
                  Source Name
                </label>
                <input id="add-name" type="text" value={addName} onChange={e => setAddName(e.target.value)} required
                  placeholder="e.g. Nation Africa — Top Stories"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all duration-300"
                  style={{ borderColor: 'var(--border-subtle)', ['--tw-ring-color' as string]: 'var(--success)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="add-url">
                  RSS Feed URL
                </label>
                <input id="add-url" type="url" value={addUrl} onChange={e => setAddUrl(e.target.value)} required
                  placeholder="https://example.com/rss"
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all duration-300"
                  style={{ borderColor: 'var(--border-subtle)', ['--tw-ring-color' as string]: 'var(--success)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="add-cat">
                  Category <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select id="add-cat" value={addCatId} onChange={e => setAddCatId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white transition-all duration-300"
                  style={{ borderColor: 'var(--border-subtle)', ['--tw-ring-color' as string]: 'var(--success)' }}>
                  <option value="">Uncategorised</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 font-semibold py-2.5 rounded-xl text-sm transition-all duration-300"
                  style={{ background: 'var(--primary-light)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={addLoading || !addName.trim() || !addUrl.trim()}
                  className="flex-1 text-white font-bold py-2.5 rounded-xl text-sm transition-all duration-300 disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}>
                  {addLoading ? 'Adding…' : '+ Add Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
