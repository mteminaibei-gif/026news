'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate, safeRefresh } from '@/lib/utils'
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
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

      const res  = await fetch('/api/admin/fetch-feeds', { method: 'POST', headers })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data) {
        setFetchResult(`❌ Fetch failed (${res.status}) — check server logs.`)
      } else {
        const f      = data.feeds ?? 0
        const ins    = data.inserted ?? 0
        const skipped = data.skipped ?? 0
        const errs   = data.errors ?? 0
        setFetchResult(
          `✅ Done — ${ins} inserted, ${skipped} skipped` +
          (errs ? `, ${errs} errors` : '') + ` across ${f} feeds.`
        )
      }
      safeRefresh(router)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Feeds',   value: feeds.length,            color: 'var(--primary)' },
          { label: 'Active',        value: active,                  color: 'var(--primary)' },
          { label: 'Inactive',      value: feeds.length - active,   color: 'var(--text-tertiary)' },
          { label: 'Total Fetches', value: totalFetch.toLocaleString(), color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>RSS Feed Sources</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Auto-fetched daily via Vercel Cron.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {fetchResult && (
            <span style={{ fontSize: '0.78rem', padding: '8px 14px', borderRadius: 10, color: 'var(--text-secondary)', background: 'var(--primary-light)' }}>{fetchResult}</span>
          )}
          <button onClick={() => setShowAdd(true)}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'oklch(98% 0.005 175)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Feed
          </button>
          <button onClick={runFetchAll} disabled={running}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--warning)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: running ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: running ? 0.6 : 1 }}>
            {running ? '⏳ Fetching…' : '⚡ Fetch All Now'}
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search feeds by name or URL…"
            style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{
                padding: '9px 16px', borderRadius: 10, border: 'none', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                background: filterStatus === s ? 'var(--primary)' : 'var(--primary-light)',
                color: filterStatus === s ? 'oklch(98% 0.005 175)' : 'var(--text-secondary)',
              }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Feed cards */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-tertiary)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16 }}>
          No feeds match your search.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {visible.map(f => (
            <div key={f.feed_id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.is_active ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</h3>
                  </div>
                  <a href={f.feed_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '0.74rem', color: 'var(--primary)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {f.feed_url}
                  </a>
                </div>
                {f.category && (
                  <span style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 20, background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.68rem', fontWeight: 600 }}>
                    {f.category.name}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                <span>Last fetched: {f.last_fetched ? formatDate(f.last_fetched) : 'Never'}</span>
                <span>{f.fetch_count ?? 0} fetches</span>
              </div>

              {f.last_error && (
                <div style={{ fontSize: '0.72rem', color: 'var(--error)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>⚠ {f.last_error}</div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
                <button onClick={() => toggleFeed(f)} disabled={togglingId === f.feed_id}
                  style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    background: f.is_active ? 'var(--bg-inset)' : 'var(--primary-light)', color: f.is_active ? 'var(--text-secondary)' : 'var(--primary)' }}>
                  {togglingId === f.feed_id ? '…' : f.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => deleteFeed(f)} disabled={deletingId === f.feed_id}
                  style={{ padding: '8px 14px', borderRadius: 9, border: 'none', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    background: 'var(--error-light)', color: 'var(--error)' }}>
                  {deletingId === f.feed_id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Feed Modal */}
      {showAdd && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}
        >
          <div style={{ background: 'var(--bg-surface)', borderRadius: 20, boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 440, padding: 28, animation: 'ob-fade-in 0.3s var(--ease-out-expo)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 4, height: 20, borderRadius: 2, background: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>Add RSS Feed</h3>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--bg-inset)', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.9rem' }} aria-label="Close">✕</button>
            </div>

            {addError && (
              <div style={{ background: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error)', padding: '8px 12px', borderRadius: 10, fontSize: '0.82rem', marginBottom: 14 }}>{addError}</div>
            )}

            <form onSubmit={addFeed} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: 6 }}>Source Name</label>
                <input value={addName} onChange={e => setAddName(e.target.value)} required placeholder="e.g. Nation Africa — Top Stories"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: 6 }}>RSS Feed URL</label>
                <input value={addUrl} onChange={e => setAddUrl(e.target.value)} required type="url" placeholder="https://example.com/rss"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: 6 }}>Category <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-tertiary)' }}>(optional)</span></label>
                <select value={addCatId} onChange={e => setAddCatId(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }}>
                  <option value="">Uncategorised</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--primary-light)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={addLoading || !addName.trim() || !addUrl.trim()} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'oklch(98% 0.005 175)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', opacity: (addLoading || !addName.trim() || !addUrl.trim()) ? 0.6 : 1 }}>{addLoading ? 'Adding…' : '+ Add Feed'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
