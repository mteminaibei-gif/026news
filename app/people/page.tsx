'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, UserPlus, Check } from 'lucide-react'
import { useFollow } from '@/lib/hooks/useFollow'
import { useProfile } from '@/lib/hooks/useAuth'

interface Person {
  user_id: number
  name: string
  profile_image: string | null
  role: string
  bio: string | null
  is_following: boolean
}

function PersonRow({ p, currentUserId }: { p: Person; currentUserId?: number }) {
  const { following, toggle, loading } = useFollow(p.user_id, p.is_following)
  const isSelf = currentUserId && p.user_id === currentUserId
  return (
    <div className="social-post" style={{ alignItems: 'center', display: 'flex', gap: '0.75rem' }}>
      <Link href={`/journalists/${p.user_id}`} className="social-avatar-link">
        {p.profile_image
          ? <img src={p.profile_image} alt={p.name} className="social-avatar-img" />
          : <div className="social-avatar">{p.name.charAt(0).toUpperCase()}</div>}
      </Link>
      <div className="social-post-meta" style={{ flex: 1 }}>
        <Link href={`/journalists/${p.user_id}`} className="social-post-author">{p.name}</Link>
        <span className="social-post-sub">{p.role}{p.bio ? ` · ${p.bio.slice(0, 60)}` : ''}</span>
      </div>
      {!isSelf && (
        <button
          className={`social-follow-btn ${following ? 'following' : ''}`}
          onClick={toggle}
          disabled={loading}
        >
          {following ? (<><Check size={14} /> Following</>) : (<><UserPlus size={14} /> Follow</>)}
        </button>
      )}
    </div>
  )
}

export default function PeoplePage() {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const { data: profile } = useProfile(undefined)

  const search = useCallback(async (term: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(term)}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(q), 250)
    return () => clearTimeout(t)
  }, [q, search])

  return (
    <div className="social-page">
      <div className="social-container" style={{ gridTemplateColumns: '1fr' }}>
        <main className="social-main">
          <div className="social-header">
            <h1 className="social-title">Find People</h1>
            <p className="social-subtitle">Discover journalists, readers and creators in the 026 community</p>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name or bio…"
              className="social-compose-input"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.75rem 1rem 0.75rem 2.5rem', marginBottom: '1rem' }}
            />
          </div>

          {loading && <p className="social-side-note">Searching…</p>}
          {!loading && users.length === 0 && (
            <div className="social-empty"><p>No people found. Try another search.</p></div>
          )}

          <div className="social-feed">
            {users.map(u => <PersonRow key={u.user_id} p={u} currentUserId={profile?.user_id} />)}
          </div>
        </main>
      </div>
    </div>
  )
}
