'use client'

import { useState } from 'react'

const ARTICLES = [
  { id: 1, title: 'Kenya Signs New Trade Deal with EU', author: 'Amina Osei', category: 'Politics', status: 'pending', wordCount: 1240, qualityScore: 87, readTime: '5 min', flagged: [] },
  { id: 2, title: 'Nairobi Tech Hub Raises $50M in Series B', author: 'James Mwangi', category: 'Business', status: 'approved', wordCount: 890, qualityScore: 92, readTime: '4 min', flagged: [] },
  { id: 3, title: 'Safari Stars Prepare for World Cup Qualifier', author: 'Faith Wanjiku', category: 'Sports', status: 'flagged', wordCount: 650, qualityScore: 68, readTime: '3 min', flagged: ['Unverified source', 'Possible plagiarism'] },
  { id: 4, title: 'New Mombasa Port Expansion Completed', author: 'Odhiambo Okeyo', category: 'Business', status: 'pending', wordCount: 1580, qualityScore: 91, readTime: '6 min', flagged: [] },
  { id: 5, title: 'Controversial Bill Sparks Protests in Nairobi', author: 'Amina Osei', category: 'Politics', status: 'in-review', wordCount: 2100, qualityScore: 79, readTime: '8 min', flagged: ['Needs fact-check'] },
  { id: 6, title: 'New Mobile Banking Regulations Announced', author: 'James Mwangi', category: 'Technology', status: 'rejected', wordCount: 420, qualityScore: 45, readTime: '2 min', flagged: ['Low quality', 'Insufficient sources'] },
]

const TABS = ['All', 'Pending', 'Approved', 'Rejected', 'Flagged', 'In Review'] as const

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')

  const filtered = ARTICLES.filter(a => {
    if (activeTab !== 'All' && a.status !== activeTab.toLowerCase().replace(' ', '-')) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    if (authorFilter && a.author !== authorFilter) return false
    return true
  })

  const stats = [
    { label: 'Pending Review', value: ARTICLES.filter(a => a.status === 'pending').length, color: 'var(--warning)' },
    { label: 'Approved Today', value: 12, color: 'var(--success)' },
    { label: 'Rejected Today', value: 3, color: 'var(--error)' },
    { label: 'Avg Review Time', value: '4.2 min', color: 'var(--primary)' },
  ]

  const statusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      pending: { bg: 'var(--warning-light)', color: 'var(--warning)' },
      approved: { bg: 'var(--success-light)', color: 'var(--success)' },
      rejected: { bg: 'var(--error-light)', color: 'var(--error)' },
      flagged: { bg: 'var(--error-light)', color: 'var(--error)' },
      'in-review': { bg: 'var(--primary-light)', color: 'var(--primary)' },
    }
    return map[status] || { bg: 'var(--bg-inset)', color: 'var(--text-secondary)' }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
          Article Moderation Queue
        </h1>
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
          Review All
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12,
            padding: 20,
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-inset)', borderRadius: 10, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
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

      {/* Search and author filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 220, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit',
          }}
        />
        <select
          value={authorFilter}
          onChange={e => setAuthorFilter(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.88rem',
            fontFamily: 'inherit', cursor: 'pointer', minWidth: 180,
          }}
        >
          <option value="">All Authors</option>
          <option value="Amina Osei">Amina Osei</option>
          <option value="James Mwangi">James Mwangi</option>
          <option value="Faith Wanjiku">Faith Wanjiku</option>
          <option value="Odhiambo Okeyo">Odhiambo Okeyo</option>
        </select>
      </div>

      {/* Article cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map(article => {
          const sc = statusStyle(article.status)
          return (
            <div key={article.id} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12,
              padding: 24, transition: 'box-shadow 0.3s',
            }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)' }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                    {article.title}
                  </h3>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span>{article.author}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{article.category}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{article.wordCount.toLocaleString()} words</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{article.readTime} read</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    background: 'var(--bg-inset)', borderRadius: 8, padding: '6px 12px',
                    textAlign: 'center', minWidth: 60,
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Score</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: article.qualityScore >= 80 ? 'var(--success)' : article.qualityScore >= 60 ? 'var(--warning)' : 'var(--error)' }}>
                      {article.qualityScore}
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-block', padding: '5px 14px', borderRadius: 99, fontSize: '0.78rem',
                    fontWeight: 600, background: sc.bg, color: sc.color, textTransform: 'capitalize',
                  }}>
                    {article.status.replace('-', ' ')}
                  </span>
                </div>
              </div>

              {article.flagged.length > 0 && (
                <div style={{
                  display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '10px 14px',
                  borderRadius: 8, background: 'var(--error-light)',
                }}>
                  {article.flagged.map((issue, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: '0.78rem', color: 'var(--error)', fontWeight: 500,
                    }}>
                      ⚠ {issue}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'var(--success)', color: '#fff', fontWeight: 600,
                  fontSize: '0.82rem', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                  onMouseOver={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
                >
                  ✓ Approve
                </button>
                <button style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'var(--warning)', color: '#fff', fontWeight: 600,
                  fontSize: '0.82rem', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                  onMouseOver={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
                >
                  ✎ Request Changes
                </button>
                <button style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'var(--error)', color: '#fff', fontWeight: 600,
                  fontSize: '0.82rem', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                  onMouseOver={e => { e.currentTarget.style.opacity = '0.85' }}
                  onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
                >
                  ✕ Reject
                </button>
                <button style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer',
                  background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600,
                  fontSize: '0.82rem', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-inset)' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  ⓘ More Info
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
