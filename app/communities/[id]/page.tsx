'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Check, Send } from 'lucide-react'

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

interface ThreadPost {
  post_id: number
  thread_id: string
  user_id: number
  content: string
  image_urls: string[] | null
  like_count: number
  created_at: string
  author: { user_id: number; name: string; profile_image: string | null; bio: string | null; role: string } | null
}

export default function CommunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id)

  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<ThreadPost[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/communities'),
        fetch(`/api/communities/${id}/posts`),
      ])
      if (cRes.ok) {
        const cdata = await cRes.json()
        setCommunity((cdata.communities ?? []).find((c: Community) => c.id === id) ?? null)
      }
      if (pRes.ok) {
        const pdata = await pRes.json()
        setPosts(pdata.posts ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const toggleMembership = async () => {
    if (!community) return
    setBusy(true)
    try {
      const res = await fetch(`/api/communities/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: community.is_member ? 'leave' : 'join' }),
      })
      if (res.ok) {
        setCommunity(prev => prev ? {
          ...prev,
          is_member: !prev.is_member,
          member_count: prev.member_count + (prev.is_member ? -1 : 1),
        } : prev)
      }
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    const content = text.trim()
    if (!content || busy) return
    setBusy(true)
    try {
      const res = await fetch(`/api/communities/${id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const data = await res.json()
        setPosts(prev => [data.post as ThreadPost, ...prev])
        setText('')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="social-page">
      <div className="social-container" style={{ gridTemplateColumns: '1fr' }}>
        <main className="social-main">
          <button className="social-icon-btn" onClick={() => router.push('/communities')} style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
            <ArrowLeft size={18} /> Back
          </button>

          {loading && !community ? (
            <p className="social-side-note">Loading community…</p>
          ) : !community ? (
            <div className="social-empty"><p>Community not found.</p></div>
          ) : (
            <>
              <div className="social-post">
                <div className="social-post-head">
                  <div className="social-avatar"><Users size={18} /></div>
                  <div className="social-post-meta" style={{ flex: 1 }}>
                    <span className="social-post-author">{community.title ?? 'Untitled'}</span>
                    <span className="social-post-sub">
                      {community.member_count} member{community.member_count === 1 ? '' : 's'}
                      {community.creator ? ` · by ${community.creator.name}` : ''}
                    </span>
                  </div>
                  <button
                    className={`social-follow-btn ${community.is_member ? 'following' : ''}`}
                    onClick={toggleMembership}
                    disabled={busy}
                  >
                    {community.is_member ? (<><Check size={14} /> Joined</>) : 'Join'}
                  </button>
                </div>
                {community.description && <p className="social-post-content" style={{ marginTop: '0.5rem' }}>{community.description}</p>}
              </div>

              {community.is_member && (
                <div className="social-compose">
                  <div className="social-compose-main">
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder={`Post in ${community.title ?? 'community'}…`}
                      className="social-compose-input"
                      rows={2}
                    />
                    <div className="social-compose-actions">
                      <button className="social-post-btn" onClick={submit} disabled={!text.trim() || busy}>
                        <Send size={14} /> Post
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="social-feed">
                {posts.length === 0 ? (
                  <div className="social-empty"><p>No posts yet. Be the first!</p></div>
                ) : (
                  posts.map(p => (
                    <article key={p.post_id} className="social-post">
                      <div className="social-post-head">
                        <Link href={`/journalists/${p.author?.user_id ?? ''}`} className="social-avatar-link">
                          {p.author?.profile_image
                            ? <img src={p.author.profile_image} alt="" className="social-avatar-img" />
                            : <div className="social-avatar">{(p.author?.name ?? 'U').charAt(0).toUpperCase()}</div>}
                        </Link>
                        <div className="social-post-meta">
                          <Link href={`/journalists/${p.author?.user_id ?? ''}`} className="social-post-author">{p.author?.name ?? 'Unknown'}</Link>
                          <span className="social-post-sub">{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</span>
                        </div>
                      </div>
                      <p className="social-post-content">{p.content}</p>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
