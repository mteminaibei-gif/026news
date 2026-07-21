'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRSSFeeds, type RSSFeed } from '@/lib/hooks/useRSSFeeds'
import { Card, StatCard, TabNav, Button, Input, EmptyState } from '@/components/ui'
import { RefreshCw, Plus, Pause, Play, Trash2, Check, AlertCircle, Clock, Rss } from 'lucide-react'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'error', label: 'Error' },
  { id: 'paused', label: 'Paused' },
]

const getStatusIcon = (status: string) => {
  if (status === 'active') return <Check size={16} style={{ color: 'var(--success)' }} />
  if (status === 'error') return <AlertCircle size={16} style={{ color: 'var(--error)' }} />
  if (status === 'paused') return <Pause size={16} style={{ color: 'var(--warning)' }} />
  return <Clock size={16} style={{ color: 'var(--text-tertiary)' }} />
}

const getStatusColor = (status: string) => {
  if (status === 'active') return { bg: 'var(--success-light)', color: 'var(--success)' }
  if (status === 'error') return { bg: 'var(--error-light)', color: 'var(--error)' }
  if (status === 'paused') return { bg: 'var(--warning-light)', color: 'var(--warning)' }
  return { bg: 'var(--primary-light)', color: 'var(--primary)' }
}

export default function RSSAdminPage() {
  const { feeds, stats, loading, error, updateFeed, refetch } = useRSSFeeds()
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newFeed, setNewFeed] = useState({ name: '', url: '', category: '' })

  const handleRefreshAll = async () => {
    await refetch()
  }

  const handleToggle = async (feed: RSSFeed) => {
    setBusyId(feed.id)
    try {
      await updateFeed(feed.id, { status: feed.status === 'active' ? 'paused' : 'active' })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (feed: RSSFeed) => {
    if (!confirm(`Remove "${feed.name}"?`)) return
    setBusyId(feed.id)
    try {
      const supabase = createClient()
      await supabase.from('rss_feeds').delete().eq('feed_id', feed.id)
      await refetch()
    } finally {
      setBusyId(null)
    }
  }

  const handleAdd = async () => {
    if (!newFeed.name || !newFeed.url) return
    setBusyId(-1)
    try {
      const supabase = createClient()
      await supabase.from('rss_feeds').insert({
        name: newFeed.name,
        feed_url: newFeed.url,
        category_id: newFeed.category ? Number(newFeed.category) : null,
        is_active: true,
      } as never)
      setNewFeed({ name: '', url: '', category: '' })
      setShowAdd(false)
      await refetch()
    } finally {
      setBusyId(null)
    }
  }

  const visible = feeds
    .filter(f =>
      activeTab === 'all' ? true : f.status === activeTab
    )
    .filter(f =>
      searchTerm ? f.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
    )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            RSS Feed Manager
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Pull related content from external sources into the homepage feed
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="secondary" size="sm" onClick={handleRefreshAll} disabled={loading}>
              <RefreshCw size={14} style={{ marginRight: '0.5rem' }} className={loading ? 'animate-spin' : ''} />
              Refresh All
            </Button>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowAdd(v => !v)}>
            <Plus size={14} style={{ marginRight: '0.5rem' }} />
            Add Feed
          </Button>
        </div>

        {showAdd && (
          <Card variant="elevated" padding="lg" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              New Feed
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Input
                placeholder="Name (e.g. TechCrunch Africa)"
                value={newFeed.name}
                onChange={e => setNewFeed({ ...newFeed, name: e.target.value })}
              />
              <Input
                placeholder="RSS URL"
                value={newFeed.url}
                onChange={e => setNewFeed({ ...newFeed, url: e.target.value })}
                style={{ flex: 1, minWidth: 240 }}
              />
              <Input
                placeholder="Category ID"
                value={newFeed.category}
                onChange={e => setNewFeed({ ...newFeed, category: e.target.value })}
                style={{ width: 120 }}
              />
              <Button variant="primary" size="sm" onClick={handleAdd} disabled={busyId === -1}>
                Save
              </Button>
            </div>
          </Card>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <StatCard label="Active Feeds" value={stats.active} color="var(--success)" />
          <StatCard label="Paused" value={stats.pending} color="var(--warning)" />
          <StatCard label="Errors" value={stats.errors} color="var(--error)" />
          <StatCard label="Total Feeds" value={stats.total} color="var(--primary)" />
          <StatCard label="Items / day" value={stats.itemsToday} color="var(--info)" />
        </div>

        <Card variant="elevated" padding="lg" style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Connected Feeds ({stats.total})
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Live data from your rss_feeds table
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
            <Input
              placeholder="Search feeds…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 220 }}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading feeds…</div>
            ) : visible.length === 0 ? (
              <EmptyState icon="📡" title="No feeds" description="No feeds match your filter" />
            ) : (
              visible.map(feed => {
                const statusColors = getStatusColor(feed.status)
                return (
                  <div
                    key={feed.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      background: 'var(--bg-muted)',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ minWidth: 24 }}>
                      {getStatusIcon(feed.status)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {feed.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            background: statusColors.bg,
                            color: statusColors.color,
                            textTransform: 'capitalize',
                          }}
                        >
                          {feed.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                        {feed.url}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>{feed.itemsPerDay ?? 0} items/day</span>
                        <span>Last: {feed.lastSync}</span>
                        <span>{feed.frequency}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(feed)} disabled={busyId === feed.id}>
                        {feed.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(feed)} disabled={busyId === feed.id}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            <Rss size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            How aggregation works
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Active feeds are fetched on a schedule and their articles are inserted as{' '}
            <code style={{ background: 'var(--bg-muted)', padding: '0 4px', borderRadius: 4 }}>published</code> with{' '}
            <code style={{ background: 'var(--bg-muted)', padding: '0 4px', borderRadius: 4 }}>is_aggregated = true</code>. They
            appear in the homepage feed alongside in-house reporting, with in-house posts always prioritised.
          </p>
        </Card>
      </div>
    </div>
  )
}
