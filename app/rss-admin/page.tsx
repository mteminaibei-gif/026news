'use client'

import { useState } from 'react'

const FEEDS = [
  { id: 1, name: 'Reuters Africa', url: 'reuters.com/africa', category: 'World', status: 'active', lastSync: '2 min ago', frequency: '15 min' },
  { id: 2, name: 'TechCrunch', url: 'techcrunch.com', category: 'Technology', status: 'active', lastSync: '5 min ago', frequency: '10 min' },
  { id: 3, name: 'ESPN Kenya', url: 'ke.espn.com', category: 'Sports', status: 'paused', lastSync: '1 hr ago', frequency: '30 min' },
  { id: 4, name: 'BBC News', url: 'bbc.co.uk/news', category: 'World', status: 'active', lastSync: '1 min ago', frequency: '5 min' },
  { id: 5, name: 'Business Daily', url: 'businessdailyafrica.com', category: 'Business', status: 'error', lastSync: '3 hrs ago', frequency: '15 min' },
  { id: 6, name: 'Capital FM', url: 'capitalfm.co.ke', category: 'Entertainment', status: 'active', lastSync: '8 min ago', frequency: '20 min' },
  { id: 7, name: 'The Star Kenya', url: 'the-star.co.ke', category: 'Politics', status: 'pending', lastSync: '—', frequency: '15 min' },
]

const TABS = ['All', 'Active', 'Paused', 'Error'] as const

export default function RssAdminPage() {
  const [activeTab, setActiveTab] = useState<string>('All')

  const filtered = activeTab === 'All' ? FEEDS : FEEDS.filter(f => f.status === activeTab.toLowerCase())

  const stats = [
    { label: 'Total Feeds', value: FEEDS.length },
    { label: 'Active', value: FEEDS.filter(f => f.status === 'active').length },
    { label: 'Pending Review', value: FEEDS.filter(f => f.status === 'pending').length },
    { label: 'Synced Today', value: 142 },
  ]

  const statusColor = (status: string) => {
    if (status === 'active') return { bg: 'var(--success-light)', color: 'var(--success)' }
    if (status === 'paused') return { bg: 'var(--warning-light)', color: 'var(--warning)' }
    if (status === 'error') return { bg: 'var(--error-light)', color: 'var(--error)' }
    return { bg: 'var(--primary-light)', color: 'var(--primary)' }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
          RSS Feed Manager
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer',
              background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600,
              fontSize: '0.88rem', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Sync Now
          </button>
          <button
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--primary)', color: '#fff', fontWeight: 700,
              fontSize: '0.88rem', fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: '0 2px 8px oklch(45% 0.12 175 / 0.3)',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-hover)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--primary)' }}
          >
            Add Feed
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12,
            padding: '20px', transition: 'box-shadow 0.3s',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-inset)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 600 : 500, fontSize: '0.85rem',
              fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: activeTab === tab ? 'var(--card-shadow)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-inset)' }}>
              {['Source', 'Category', 'Status', 'Last Sync', 'Frequency', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left', fontWeight: 600,
                  color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(feed => {
              const sc = statusColor(feed.status)
              return (
                <tr key={feed.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-inset)' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{feed.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{feed.url}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{feed.category}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: 99, fontSize: '0.78rem',
                      fontWeight: 600, background: sc.bg, color: sc.color, textTransform: 'capitalize',
                    }}>
                      {feed.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{feed.lastSync}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{feed.frequency}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['⏸', '✏️', '🗑'].map((icon, i) => (
                        <button key={i} style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: 'var(--bg-inset)', color: 'var(--text-secondary)',
                          fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                          onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-inset)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
