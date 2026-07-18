'use client'

import { useState } from 'react'

const CATEGORIES = ['World Updates', 'Kenya Focus', 'Politics & Governance', 'Business & Economy', 'Tech & Innovation', 'Health & Wellness', 'Arts & Culture', 'Sports Arena', 'Opinion & Analysis', 'Trending Now', 'Features & Profiles', 'Environment & Climate']
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent']

export default function EditorialWritePage() {
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [featured, setFeatured] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingTop: 80, padding: '80px 24px 60px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 32, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        New Editorial Article
      </h1>

      {/* Top controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)',
            fontFamily: 'inherit', fontSize: '0.88rem', cursor: 'pointer', minWidth: 150,
          }}
        >
          <option value="">Category</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)',
            fontFamily: 'inherit', fontSize: '0.88rem', cursor: 'pointer', minWidth: 130,
          }}
        >
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <div
            onClick={() => setFeatured(!featured)}
            style={{
              width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
              background: featured ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
              left: featured ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
          Featured
        </label>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => {}}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600,
              fontSize: '0.88rem', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-inset)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Save Draft
          </button>
          <button
            onClick={() => {}}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer',
              background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600,
              fontSize: '0.88rem', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Title input */}
      <input
        type="text"
        placeholder="Article title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{
          width: '100%', padding: '14px 0', border: 'none', borderBottom: '2px solid var(--border)',
          background: 'transparent', color: 'var(--text-primary)',
          fontSize: '1.75rem', fontWeight: 700, fontFamily: "'Space Grotesk', system-ui, sans-serif",
          outline: 'none', marginBottom: 12, transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = 'var(--primary)' }}
        onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--border)' }}
      />

      {/* Subtitle input */}
      <input
        type="text"
        placeholder="Subtitle (optional)..."
        value={subtitle}
        onChange={e => setSubtitle(e.target.value)}
        style={{
          width: '100%', padding: '10px 0', border: 'none', borderBottom: '1px solid var(--border-subtle)',
          background: 'transparent', color: 'var(--text-secondary)',
          fontSize: '1.1rem', fontWeight: 400, fontFamily: 'inherit', outline: 'none', marginBottom: 32,
          transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = 'var(--primary)' }}
        onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--border-subtle)' }}
      />

      {/* MDEditor placeholder */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12,
        overflow: 'hidden', marginBottom: 32,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)',
        }}>
          {['B', 'I', 'H1', 'H2', 'Link', 'Quote', 'Code', 'List'].map(btn => (
            <button key={btn} style={{
              padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600,
              fontSize: '0.8rem', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {btn}
            </button>
          ))}
        </div>
        <textarea
          placeholder="Write your article content in Markdown..."
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{
            width: '100%', minHeight: 300, padding: '20px 24px', border: 'none',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)',
            fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, lineHeight: 1.85,
            resize: 'vertical', outline: 'none',
          }}
        />
      </div>

      {/* Bottom action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => {}}
          style={{
            padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600,
            fontSize: '0.95rem', fontFamily: 'inherit', transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-inset)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
        >
          Cancel
        </button>
        <button
          onClick={() => {}}
          style={{
            padding: '12px 32px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'var(--primary)', color: '#fff', fontWeight: 700,
            fontSize: '0.95rem', fontFamily: 'inherit', transition: 'all 0.2s',
            boxShadow: '0 2px 8px oklch(45% 0.12 175 / 0.3)',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-hover)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--primary)' }}
        >
          Submit for Review
        </button>
      </div>
    </div>
  )
}
