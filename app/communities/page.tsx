'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Users, Check, Compass } from 'lucide-react'

interface Community {
  id: string
  title: string | null
  description: string
  is_public: boolean
  created_at: string
  member_count: number
  creator: { name: string; profile_image: string | null } | null
  is_member: boolean
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/communities')
      if (res.ok) {
        const data = await res.json()
        setCommunities(data.communities ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!title.trim()) return
    const res = await fetch('/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: desc }),
    })
    if (res.ok) {
      setTitle(''); setDesc(''); setShowCreate(false)
      load()
    }
  }

  const toggleMembership = async (c: Community) => {
    setBusyId(c.id)
    try {
      const res = await fetch(`/api/communities/${c.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: c.is_member ? 'leave' : 'join' }),
      })
      if (res.ok) {
        setCommunities(prev => prev.map(x => x.id === c.id
          ? { ...x, is_member: !x.is_member, member_count: x.member_count + (x.is_member ? -1 : 1) }
          : x))
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="social-page">
      <div className="social-container" style={{ gridTemplateColumns: '1fr' }}>
        <main className="social-main">
          <div className="social-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="social-title">Communities</h1>
              <p className="social-subtitle">Topic-based groups for the 026 community</p>
            </div>
            <button className="social-post-btn" onClick={() => setShowCreate(v => !v)}>
              <Plus size={16} /> New
            </button>
          </div>

          {showCreate && (
            <div className="social-compose" style={{ flexDirection: 'column' }}>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Community name (e.g. Nairobi Tech)"
                className="social-compose-input"
                style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.6rem 0.8rem' }}
              />
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Description"
                className="social-compose-input"
                rows={2}
                style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.6rem 0.8rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="social-follow-btn following" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="social-follow-btn" onClick={create}>Create</button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="social-side-note">Loading communities…</p>
          ) : communities.length === 0 ? (
            <div className="social-empty">
              <Compass size={28} style={{ opacity: 0.5 }} />
              <p>No communities yet. Create the first one!</p>
            </div>
          ) : (
            <div className="social-feed">
              {communities.map(c => (
                <div key={c.id} className="social-post" style={{ cursor: 'pointer' }}>
                  <Link href={`/communities/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'contents' }}>
                    <div className="social-post-head">
                      <div className="social-avatar"><Users size={18} /></div>
                      <div className="social-post-meta" style={{ flex: 1 }}>
                        <span className="social-post-author">{c.title ?? 'Untitled'}</span>
                        <span className="social-post-sub">
                          {c.member_count} member{c.member_count === 1 ? '' : 's'}
                          {c.creator ? ` · by ${c.creator.name}` : ''}
                        </span>
                      </div>
                    </div>
                    {c.description && <p className="social-post-content" style={{ marginTop: '0.5rem' }}>{c.description}</p>}
                  </Link>
                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      className={`social-follow-btn ${c.is_member ? 'following' : ''}`}
                      onClick={() => toggleMembership(c)}
                      disabled={busyId === c.id}
                    >
                      {c.is_member ? (<><Check size={14} /> Joined</>) : 'Join'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
