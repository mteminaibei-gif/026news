'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

type NewUser = {
  user_id: number
  name: string
  email: string
  role: string
  status: string
  created_at: string
  isNew?: boolean
}

interface Props {
  /** Initial users fetched server-side (last 10 recent signups) */
  initialUsers: NewUser[]
}

export function LiveRegistrationsFeed({ initialUsers }: Props) {
  const [users, setUsers] = useState<NewUser[]>(initialUsers)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin:live-registrations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'users' },
        (payload) => {
          const u = payload.new as NewUser
          setUsers(prev => [{ ...u, isNew: true }, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const roleLabel = (role: string) =>
    role === 'journalist' ? 'Author' : role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <div className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to right, var(--primary-light), var(--bg-surface))' }}>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold" style={{ color: 'var(--primary)' }}>🆕 New Registrations</h2>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--primary)' }} />
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Live</span>
        </div>
        <Link href="/admin/users" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-300" style={{ color: 'var(--primary)', background: 'var(--border-subtle)' }}>
          View All
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <p className="text-2xl mb-2">👥</p>
          No new registrations yet. New accounts appear here instantly.
        </div>
      ) : (
        <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: 'var(--primary-light)' }}>
          {users.map(u => (
            <div
              key={`${u.user_id}-${u.created_at}`}
              className={`flex items-center gap-3 px-5 py-3 transition-all duration-500 ${
                u.isNew ? 'animate-fade-in' : ''
              }`}
              style={{ background: u.isNew ? 'var(--primary-light)' : 'transparent' }}
            >
              {/* Avatar initials */}
              <div className="w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'var(--primary)' }}>
                {(u.name || u.email).charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.name || '—'}</p>
                  {u.isNew && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--warning)', color: 'var(--text-primary)' }}>
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{u.email}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                  background: u.role === 'journalist' ? 'var(--border-subtle)' : u.role === 'admin' ? 'var(--warning-light)' : 'var(--border)',
                  color: u.role === 'journalist' ? 'var(--primary)' : u.role === 'admin' ? 'var(--warning)' : 'var(--text-tertiary)',
                }}>
                  {roleLabel(u.role)}
                </span>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{formatDate(u.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
