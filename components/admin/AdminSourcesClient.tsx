'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

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

  const [feeds, setFeeds]       = useState<FeedRow[]>(initialFeeds)
  const [running, setRunning]   = useState(false)
  const [fetchResult, setFetchResult] = useState<string | null>(null)

  // Add-feed modal
  const [showAdd, setShowAdd]         = useState(false)
  const [addName, setAddName]         = useState('')
  const [addUrl, setAddUrl]           = useState('')
  const [addCatId, setAddCatId]       = useState<number | ''>('')
  const [addError, setAddError]       = useState('')
  const [addLoading, setAddLoading]   = useState(false)

  // Per-row loading state
  const [togglingId, setTogglingId]   = useState<number | null>(null)
  const [deletingId, setDeletingId]   = useState<number | null>(null)

  // Search / filter
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  async function runFetchAll() {
    setRunning(true)
    setFetchResult(null)
    try {
      const res  = await fetch('/api/cron/fetch-feeds')
      const data = await res.json()
      setFetchResult(`✅ Done — ${data.inserted} inserted, ${data.skipped} skipped across ${data.feeds} feeds.`)
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
      if (res.ok) {
        setFeeds(prev => prev.filter(f => f.feed_id !== feed.feed_id))
      }
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

      // Add new feed to local state (no category name initially, will come after refresh)
      const cat = categories.find(c => c.category_id === Number(addCatId)) ?? null
      setFeeds(prev => [
        {
          feed_id:      data.feed_id,
          name:         addName.trim(),
          feed_url:     addUrl.trim(),
          is_active:    true,
          last_fetched: null,
          last_error:   null,
          fetch_count:  0,
          category:     cat ? { name: cat.name } : null,
        },
        ...prev,
      ])
      setAddName('')
      setAddUrl('')
      setAddCatId('')
      setShowAdd(false)
    } finally {
      setAddLoading(false)
    }
  }

  // Filtered view
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
          { label: 'Total Feeds',    value: feeds.length },
          { label: 'Active',         value: active },
          { label: 'Inactive',       value: feeds.length - active },
          { label: 'Total Fetches',  value: totalFetch.toLocaleString() },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-extrabold text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900">RSS Feed Sources</h2>
          <p className="text-xs text-gray-400 mt-0.5">Auto-fetched every 3 hours via Vercel Cron.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {fetchResult && <span className="text-xs text-gray-600">{fetchResult}</span>}
          <button
            onClick={() => setShowAdd(true)}
            className="bg-[#0a1628] hover:bg-[#162035] text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            + Add Feed
          </button>
          <button
            onClick={runFetchAll}
            disabled={running}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
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
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 flex-1 min-w-[200px]"
        />
        <div className="flex gap-1">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === s ? 'bg-[#0a1628] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 font-semibold uppercase tracking-wider">
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
            <tbody className="divide-y divide-gray-50">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    No feeds match your search.
                  </td>
                </tr>
              ) : visible.map(f => (
                <tr key={f.feed_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900 max-w-[160px]">
                    <span className="line-clamp-1">{f.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={f.feed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-xs truncate max-w-[200px] block"
                    >
                      {f.feed_url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {f.last_fetched ? formatDate(f.last_fetched) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(f.fetch_count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      f.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {f.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-red-400 text-xs max-w-[140px]">
                    <span className="line-clamp-1">{f.last_error ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => toggleFeed(f)}
                        disabled={togglingId === f.feed_id}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                          f.is_active
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {togglingId === f.feed_id ? '…' : f.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteFeed(f)}
                        disabled={deletingId === f.feed_id}
                        className="text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
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
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-extrabold text-gray-900">Add RSS Feed</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
                {addError}
              </div>
            )}

            <form onSubmit={addFeed} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="add-name">
                  Source Name
                </label>
                <input
                  id="add-name"
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  required
                  placeholder="e.g. Nation Africa — Top Stories"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="add-url">
                  RSS Feed URL
                </label>
                <input
                  id="add-url"
                  type="url"
                  value={addUrl}
                  onChange={e => setAddUrl(e.target.value)}
                  required
                  placeholder="https://example.com/rss"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="add-cat">
                  Category <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  id="add-cat"
                  value={addCatId}
                  onChange={e => setAddCatId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">Uncategorised</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !addName.trim() || !addUrl.trim()}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
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
