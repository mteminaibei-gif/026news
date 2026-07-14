'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRealtime } from '@/components/providers/RealtimeProvider'
import { timeAgo } from '@/lib/utils'

interface Activity {
  id: string
  type: 'article' | 'comment' | 'user'
  title: string
  link: string
  timestamp: string
}

export function LiveActivityFeed() {
  const { latestArticle, latestComment, latestNotification } = useRealtime()
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    if (latestArticle) {
      const act: Activity = {
        id: `art-${latestArticle.article_id}-${Date.now()}`,
        type: 'article',
        title: latestArticle.title,
        link: `/article/${latestArticle.slug}`,
        timestamp: latestArticle.created_at,
      }
      setActivities(prev => [act, ...prev].slice(0, 15))
    }
  }, [latestArticle])

  useEffect(() => {
    if (latestComment) {
      const act: Activity = {
        id: `cmt-${latestComment.comment_id}-${Date.now()}`,
        type: 'comment',
        title: `New comment on article`,
        link: `/article/#comments`,
        timestamp: latestComment.created_at,
      }
      setActivities(prev => [act, ...prev].slice(0, 15))
    }
  }, [latestComment])

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e', animation: 'pulse-dot 2s infinite' }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          Live Activity
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
        {activities.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Waiting for live activity…
          </div>
        ) : (
          activities.map(act => (
            <Link
              key={act.id}
              href={act.link}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-muted)]"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <span
                className="mt-0.5 w-2 h-2 rounded-full shrink-0"
                style={{
                  background: act.type === 'article' ? 'var(--primary)' :
                              act.type === 'comment' ? 'var(--accent)' : 'var(--success)',
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {act.title}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {timeAgo(act.timestamp)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
