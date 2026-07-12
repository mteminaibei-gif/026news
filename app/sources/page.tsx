'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const SOURCES = [
  { name: 'Daily Nation', url: 'nation.africa', category: 'National', status: 'active', articles: 45, lastFetch: '2 min ago' },
  { name: 'The Standard', url: 'standardmedia.co.ke', category: 'National', status: 'active', articles: 38, lastFetch: '5 min ago' },
  { name: 'Capital FM', url: 'capitalfm.co.ke', category: 'National', status: 'active', articles: 52, lastFetch: '1 min ago' },
  { name: 'KBC Channel 1', url: 'kbc.co.ke', category: 'National', status: 'active', articles: 31, lastFetch: '3 min ago' },
  { name: 'Business Daily', url: 'businessdailyafrica.com', category: 'Business', status: 'active', articles: 28, lastFetch: '4 min ago' },
  { name: 'The East African', url: 'theeastafrican.co.ke', category: 'Business', status: 'active', articles: 22, lastFetch: '6 min ago' },
  { name: 'TechWeez', url: 'techweez.com', category: 'Tech', status: 'active', articles: 15, lastFetch: '8 min ago' },
  { name: 'Android Kenya', url: 'androidkenya.com', category: 'Tech', status: 'pending', articles: 12, lastFetch: '15 min ago' },
  { name: 'Pulse Sports', url: 'pulsesports.co.ke', category: 'Sports', status: 'active', articles: 34, lastFetch: '2 min ago' },
  { name: 'Soccer Kenya', url: 'soccerkenya.com', category: 'Sports', status: 'error', articles: 8, lastFetch: '2 hours ago' },
  { name: 'Nation Sports', url: 'nation.africa/sport', category: 'Sports', status: 'active', articles: 29, lastFetch: '3 min ago' },
  { name: 'Kenya News Agency', url: 'kna.co.ke', category: 'National', status: 'active', articles: 41, lastFetch: '1 min ago' },
]

const TABS = ['All', 'National', 'Business', 'Tech', 'Sports']

const statusColors: Record<string, string> = {
  active: 'var(--success)',
  pending: 'var(--warning)',
  error: 'var(--error)',
}

export default function SourcesPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [customUrl, setCustomUrl] = useState('')

  const filtered = activeTab === 'All' ? SOURCES : SOURCES.filter(s => s.category === activeTab)
  const totalFeeds = SOURCES.length
  const activeFeeds = SOURCES.filter(s => s.status === 'active').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Header */}
        <section
          style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            padding: '48px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '6px 16px',
                borderRadius: 999,
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                marginBottom: 16,
              }}
            >
              RSS Aggregator
            </span>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: '#fff',
                fontFamily: "'Newsreader', Georgia, serif",
                marginBottom: 12,
              }}
            >
              News Sources
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
              Curated RSS feeds from Kenya&apos;s top news outlets
            </p>
          </div>
        </section>

        {/* Stats Row */}
        <section style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div
            style={{
              maxWidth: 960,
              margin: '0 auto',
              padding: '24px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {[
              { label: 'Total Feeds', value: totalFeeds },
              { label: 'Active Feeds', value: activeFeeds },
              { label: 'Last Sync', value: '1 min ago' },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  textAlign: 'center',
                  padding: '20px 12px',
                  borderRadius: 12,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter Tabs + Grid */}
        <section style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 24,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: activeTab === tab ? 'var(--primary)' : 'var(--border)',
                  background: activeTab === tab ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {filtered.map(source => (
              <div
                key={source.name}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: 'var(--card-shadow)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {/* Status dot + Category badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                    }}
                  >
                    {source.category}
                  </span>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: statusColors[source.status] ?? 'var(--text-muted)',
                    }}
                  />
                </div>

                {/* Name */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {source.name}
                </h3>

                {/* URL */}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  {source.url}
                </p>

                {/* Meta row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  <span>{source.articles} articles</span>
                  <span>{source.lastFetch}</span>
                </div>

                {/* View Feed button */}
                <button
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 10,
                    border: '1px solid var(--primary)',
                    background: 'transparent',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--primary)'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--primary)'
                  }}
                >
                  View Feed
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Add Custom Feed */}
        <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 48px' }}>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              padding: 32,
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: "'Newsreader', Georgia, serif",
                marginBottom: 8,
              }}
            >
              Add Custom Feed
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 20 }}>
              Enter an RSS feed URL to add a new source to your aggregator.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="url"
                placeholder="https://example.com/feed.xml"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                }}
              />
              <button
                style={{
                  padding: '12px 28px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary)')}
              >
                Add Feed
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}