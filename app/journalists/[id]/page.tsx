'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Heart, Bookmark, MessageSquare, Bell, Settings, Send, Share2, UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { formatNumber, stripHtml } from '@/lib/utils'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { ProfileNav } from '@/components/layout/ProfileNav'

interface Profile {
  user_id: number; name: string; role: string; bio: string | null
  profile_image: string | null; created_at: string
}
interface Article {
  article_id: number; title: string; slug: string; content: string
  featured_image: string | null; views: number; likes: number; post_type: string
  created_at: string; category?: { name: string } | null; status: string
}
interface Notification {
  notification_id: number; type: string; title: string; message: string
  is_read: boolean; created_at: string
}
interface Conversation {
  other_user: { user_id: number; name: string; profile_image: string | null }
  last_message: string; last_message_at: string; unread: number
}

export default function JournalistProfilePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const targetUserId = Number(params.id)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'articles' | 'about'>('articles')

  const [articles, setArticles] = useState<Article[]>([])
  const [savedArticles, setSaved] = useState<any[]>([])
  const [likedArticles, setLiked] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [notifications, setNotifs] = useState<Notification[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])

  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (!targetUserId) return
    resolveCurrentUser()
  }, [targetUserId])

  useEffect(() => {
    if (currentUserId === null) return
    loadProfile()
    loadArticles()
    loadSaved()
    loadLiked()
    loadComments()
    loadNotifs()
    loadFollowing()
    loadConversations()
    checkFollowStatus()
  }, [currentUserId, targetUserId])

  async function resolveCurrentUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser?.id) {
      const { data } = await supabase.from('users').select('user_id').eq('auth_id', authUser.id).single()
      if (data) setCurrentUserId((data as { user_id: number }).user_id)
    }
    setProfileLoading(false)
  }

  async function loadProfile() {
    const { data } = await supabase
      .from('users')
      .select('user_id, name, role, bio, profile_image, created_at')
      .eq('user_id', targetUserId)
      .single()
    if (data) setProfile(data as Profile)
  }

  async function loadArticles() {
    try {
      const { data } = await supabase
        .from('articles')
        .select('*, category:categories(name)')
        .eq('author_id', targetUserId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20)
      setArticles((data as Article[]) || [])
    } catch { setArticles([]) }
  }

  async function loadSaved() {
    if (!currentUserId) return
    try {
      const { data } = await supabase
        .from('saved_articles')
        .select('article_id, saved_at, articles!inner(article_id, title, slug, featured_image, read_time, created_at, users:user_id(name), categories:category_id(name))')
        .eq('user_id', currentUserId)
        .order('saved_at', { ascending: false })
        .limit(10)
      setSaved((data as any[]) || [])
    } catch { setSaved([]) }
  }

  async function loadLiked() {
    if (!currentUserId) return
    try {
      const { data } = await supabase
        .from('likes')
        .select('created_at, articles!inner(article_id, title, slug, featured_image, read_time, created_at, users:user_id(name), categories:category_id(name))')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10)
      setLiked((data as any[]) || [])
    } catch { setLiked([]) }
  }

  async function loadComments() {
    if (!currentUserId) return
    try {
      const { data } = await supabase
        .from('comments')
        .select('*, articles!inner(article_id, title, slug, featured_image)')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10)
      setComments((data as any[]) || [])
    } catch { setComments([]) }
  }

  async function loadNotifs() {
    if (!currentUserId) return
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10)
      setNotifs((data as Notification[]) || [])
    } catch { setNotifs([]) }
  }

  async function loadFollowing() {
    if (!currentUserId) return
    try {
      const { data } = await supabase
        .from('user_follows')
        .select('*, following:users!user_follows_following_id_fkey(user_id, name, profile_image, role)')
        .eq('follower_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10)
      setFollowing((data as any[]) || [])
    } catch { setFollowing([]) }
  }

  async function loadConversations() {
    if (!currentUserId) return
    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, message, created_at')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!msgs?.length) { setConversations([]); return }

      const convMap = new Map<number, Conversation>()
      for (const msg of msgs as { sender_id: number; receiver_id: number; message: string; created_at: string }[]) {
        const otherId: number = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
        if (otherId === currentUserId) continue
        if (!convMap.has(otherId)) {
          const { data: u } = await supabase.from('users').select('user_id, name, profile_image').eq('user_id', otherId).single()
          const fallback = { user_id: otherId, name: 'Unknown', profile_image: null }
          convMap.set(otherId, {
            other_user: u ? (u as { user_id: number; name: string; profile_image: string | null }) : fallback,
            last_message: msg.message,
            last_message_at: msg.created_at,
            unread: 0,
          })
        }
      }
      setConversations(Array.from(convMap.values()).slice(0, 5))
    } catch { setConversations([]) }
  }

  async function checkFollowStatus() {
    if (!currentUserId) return
    try {
      const { data } = await supabase
        .from('user_follows')
        .select('follow_id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle()
      setIsFollowing(!!data)
    } catch { setIsFollowing(false) }
  }

  async function toggleFollow() {
    if (!currentUserId) { router.push('/login?redirect=' + encodeURIComponent(window.location.pathname)); return }
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
        setIsFollowing(false)
      } else {
        await supabase
          .from('user_follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId } as never)
        setIsFollowing(true)
      }
    } catch {}
    setFollowLoading(false)
  }

  async function toggleSave(articleId: number) {
    if (!currentUserId) { router.push('/login?redirect=' + encodeURIComponent(window.location.pathname)); return }
    const exists = savedArticles.some(s => s.article_id === articleId)
    if (exists) {
      await supabase.from('saved_articles').delete().eq('user_id', currentUserId).eq('article_id', articleId)
      setSaved(prev => prev.filter(s => s.article_id !== articleId))
    } else {
      await supabase.from('saved_articles').insert({ user_id: currentUserId, article_id: articleId } as never)
      setSaved(prev => [...prev, { article_id: articleId, saved_at: new Date().toISOString() }])
    }
  }

  async function toggleLike(articleId: number) {
    if (!currentUserId) { router.push('/login?redirect=' + encodeURIComponent(window.location.pathname)); return }
    const exists = likedArticles.some(l => l.articles?.article_id === articleId)
    if (exists) {
      await supabase.from('article_likes').delete().eq('user_id', currentUserId).eq('article_id', articleId)
      setLiked(prev => prev.filter(l => l.articles?.article_id !== articleId))
      setArticles(prev => prev.map(a => a.article_id === articleId ? { ...a, likes: Math.max((a.likes || 1) - 1, 0) } : a))
    } else {
      await supabase.from('article_likes').insert({ user_id: currentUserId, article_id: articleId } as never)
      setLiked(prev => [...prev, { articles: articles.find(a => a.article_id === articleId), liked_at: new Date().toISOString() }])
      setArticles(prev => prev.map(a => a.article_id === articleId ? { ...a, likes: (a.likes || 0) + 1 } : a))
    }
  }

  async function markNotifRead(id: number) {
    await supabase.from('notifications').update({ is_read: true } as never).eq('notification_id', id)
    setNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n))
  }

  if (profileLoading) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>Author not found</p>
        <button onClick={() => router.push('/')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Back to Home</button>
      </div>
    )
  }

  const isOwnProfile = currentUserId === targetUserId
  const unreadNotifs = notifications.filter(n => !n.is_read)
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="journalist-header" style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 40px' }}>
          {profile.profile_image ? (
            <div style={{ width: 120, height: 120, borderRadius: 28, overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'var(--bg-inset)' }}>
              <Image src={profile.profile_image} alt={profile.name} fill style={{ objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: 28, background: 'linear-gradient(135deg, oklch(50% 0.14 220), oklch(42% 0.12 200))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 700, color: 'oklch(98% 0.005 175)', flexShrink: 0 }}>
              {profile.name.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="journalist-header-content">
              <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: "'Newsreader', Georgia, serif" }}>{profile.name}</h1>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', marginBottom: 10 }}>@{profile.name.toLowerCase().replace(/\s+/g, '')} · Joined {joinDate}</p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '55ch', lineHeight: 1.6, marginBottom: 16 }}>{profile.bio ?? 'No bio available.'}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!isOwnProfile && (
                <button onClick={toggleFollow} disabled={followLoading}
                  style={{ padding: '10px 20px', borderRadius: 9, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none',
                    background: isFollowing ? 'var(--bg-elevated)' : 'var(--primary)', color: isFollowing ? 'var(--text-secondary)' : 'oklch(98% 0.005 175)' }}>
                  {followLoading ? <Loader2 size={15} className="animate-spin" /> : isFollowing ? <UserMinus size={15} /> : <UserPlus size={15} />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {!isOwnProfile && (
                <button onClick={() => setShowChat(true)}
                  style={{ padding: '10px 20px', borderRadius: 9, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}>
                  <MessageSquare size={15} /> Message
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setActiveTab('articles')}
          className="profile-tab-btn"
          style={{ fontWeight: 500, color: activeTab === 'articles' ? 'var(--primary)' : 'var(--text-tertiary)', borderBottomColor: activeTab === 'articles' ? 'var(--primary)' : 'transparent' }}>
          Articles ({articles.length})
        </button>
        <button onClick={() => setActiveTab('about')}
          className="profile-tab-btn"
          style={{ fontWeight: 500, color: activeTab === 'about' ? 'var(--primary)' : 'var(--text-tertiary)', borderBottomColor: activeTab === 'about' ? 'var(--primary)' : 'transparent' }}>
          About
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }} className="journalist-layout">
        {/* Profile Nav */}
        <aside style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          <ProfileNav role="journalist" userId={targetUserId} />
        </aside>
        {/* Main */}
        <main>
          {activeTab === 'articles' ? (
            articles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {articles.map(article => (
                  <div key={article.article_id} className="profile-article-card-with-image" style={{ padding: 20, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: 6 }}>{article.category?.name}</span>
                          <h3 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.35, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.title}</h3>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stripHtml(article.content).slice(0, 160)}...</p>
                        </Link>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 12, alignItems: 'center' }}>
                        <span>{article.views?.toLocaleString()} views</span>
                        <span>{article.likes?.toLocaleString()} likes</span>
                        <button onClick={() => toggleLike(article.article_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: likedArticles.some(l => l.articles?.article_id === article.article_id) ? 'var(--primary)' : 'var(--text-tertiary)', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Heart size={13} fill={likedArticles.some(l => l.articles?.article_id === article.article_id) ? 'var(--primary)' : 'none'} /> Like
                        </button>
                        <button onClick={() => toggleSave(article.article_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: savedArticles.some(s => s.article_id === article.article_id) ? '#f59e0b' : 'var(--text-tertiary)', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Bookmark size={13} fill={savedArticles.some(s => s.article_id === article.article_id) ? '#f59e0b' : 'none'} /> Save
                        </button>
                      </div>
                    </div>
                    {article.featured_image ? (
                      <Link href={`/article/${article.slug}`} style={{ display: 'block' }}>
                        <Image src={article.featured_image} alt={article.title} width={180} height={160} style={{ width: '100%', height: '100%', minHeight: 130, borderRadius: 10, objectFit: 'cover' }} />
                      </Link>
                    ) : (
                      <Link href={`/article/${article.slug}`} style={{ display: 'block', width: '100%', height: '100%', minHeight: 130, borderRadius: 10, background: 'var(--bg-inset)' }} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '64px 0', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No published articles yet.</p>
              </div>
            )
          ) : (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 32 }}>
              <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>About {profile.name}</h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>{profile.bio ?? 'No bio available.'}</p>
              <div className="about-info-grid">
                <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Role</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'capitalize' }}>{profile.role}</div>
                </div>
                <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Joined</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{joinDate}</div>
                </div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Articles Published</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{articles.length}</div>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-inset)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Total Views</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatNumber(articles.reduce((s, a) => s + (a.views ?? 0), 0))}</div>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Notifications */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700 }}>Notifications</h3>
              {unreadNotifs.length > 0 && <span style={{ fontSize: '0.65rem', fontWeight: 600, background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '2px 7px' }}>{unreadNotifs.length}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {notifications.length > 0 ? notifications.slice(0, 4).map(n => (
                <div key={n.notification_id} onClick={() => markNotifRead(n.notification_id)}
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', opacity: n.is_read ? 0.55 : 1, transition: 'opacity 0.2s' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
                </div>
              )) : (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>No notifications</p>
              )}
            </div>
            <Link href="/notifications" style={{ display: 'block', textAlign: 'center', padding: '10px 0', fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', marginTop: 8 }}>View All</Link>
          </div>

          {/* Messages */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700 }}>Messages</h3>
              {totalUnread > 0 && <span style={{ fontSize: '0.65rem', fontWeight: 600, background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '2px 7px' }}>{totalUnread}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {conversations.length > 0 ? conversations.slice(0, 4).map(c => (
                <div key={c.other_user.user_id} onClick={() => setShowChat(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'opacity 0.2s' }}>
                  {c.other_user.profile_image ? (
                    <img src={c.other_user.profile_image} alt={c.other_user.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>{c.other_user.name.charAt(0)}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600 }}>{c.other_user.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_message}</div>
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>No messages</p>
              )}
            </div>
            <Link href="/inbox" style={{ display: 'block', textAlign: 'center', padding: '10px 0', fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', marginTop: 8 }}>View Inbox</Link>
          </div>

          {/* Following */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 14 }}>Following</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {following.length > 0 ? following.slice(0, 4).map((f: any) => (
                <div key={f.follow_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  {f.following?.profile_image ? (
                    <img src={f.following.profile_image} alt={f.following.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>{f.following?.name?.charAt(0)}</div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600 }}>{f.following?.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{f.following?.role}</div>
                  </div>
                </div>
              )) : (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>Not following anyone</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 14 }}>Quick Links</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none', color: 'var(--text-secondary)' }}><Bell size={14} /> Home</Link>
              <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none', color: 'var(--text-secondary)' }}><Settings size={14} /> Settings</Link>
            </div>
          </div>
        </aside>
      </div>

      {showChat && (
        <ChatWidget
          receiverId={targetUserId}
          receiverName={profile.name}
          receiverImage={profile.profile_image}
        />
      )}
    </div>
  )
}
