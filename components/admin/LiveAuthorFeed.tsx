'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { PenLine, Eye } from 'lucide-react'

interface AuthorActivity {
  user_id: number
  name: string
  profile_image: string | null
  article_id: number
  title: string
  slug: string
  status: string
  created_at: string
}

export function LiveAuthorFeed() {
  const [activities, setActivities] = useState<AuthorActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function fetchRecent() {
      const { data } = await supabase
        .from('articles')
        .select('article_id, title, slug, status, created_at, author:user_id(user_id, name, profile_image)')
        .in('status', ['published', 'pending', 'draft'])
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        const mapped = data
          .filter((a: any) => a.author)
          .map((a: any) => ({
            user_id: a.author.user_id,
            name: a.author.name,
            profile_image: a.author.profile_image,
            article_id: a.article_id,
            title: a.title,
            slug: a.slug,
            status: a.status,
            created_at: a.created_at,
          }))
        setActivities(mapped)
      }
      setLoading(false)
    }

    fetchRecent()

    channel = supabase
      .channel('admin:live-authors')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'articles' },
        async (payload) => {
          const article = payload.new as any
          const { data: author } = await supabase
            .from('users')
            .select('user_id, name, profile_image')
            .eq('user_id', article.user_id)
            .single()

          if (author) {
            setActivities(prev => [{
              user_id: author.user_id,
              name: author.name,
              profile_image: author.profile_image,
              article_id: article.article_id,
              title: article.title,
              slug: article.slug,
              status: article.status,
              created_at: article.created_at,
            }, ...prev].slice(0, 10))
          }
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
    published: { text: 'Published', color: 'var(--success)', bg: 'var(--success-light)' },
    pending: { text: 'Pending', color: 'var(--warning)', bg: 'var(--warning-light)' },
    draft: { text: 'Draft', color: 'var(--text-tertiary)', bg: 'var(--bg-muted)' },
  }

  return (
    <div>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'oklch(55% 0.15 250 / 0.12)', color: 'oklch(55% 0.15 250)' }}>
            <PenLine size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Live Author Activity</h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Real-time posting feed</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--success)' }} />
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Live</span>
        </div>
      </div>

      <div className="divide-y max-h-80 overflow-y-auto" style={{ borderColor: 'var(--glass-border)' }}>
        {loading ? (
          <div className="px-6 py-6 text-center">
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Loading activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="px-6 py-6 text-center">
            <PenLine className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No recent activity</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Authors haven&apos;t posted yet</p>
          </div>
        ) : (
          activities.map(activity => {
            const st = statusLabel[activity.status] ?? statusLabel.draft
            return (
              <Link
                key={activity.article_id}
                href={`/article/${activity.slug}`}
                className="px-6 py-3.5 flex items-center gap-3 transition-colors"
                style={{ textDecoration: 'none', color: 'inherit' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {activity.profile_image ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                    <Image src={activity.profile_image} alt={activity.name} fill className="object-cover" sizes="32px" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {activity.name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {activity.name}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0" style={{ background: st.bg, color: st.color }}>
                      {st.text}
                    </span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {activity.title}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                    {timeAgoShort(activity.created_at)}
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}
