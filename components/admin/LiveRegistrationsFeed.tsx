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
    <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="px-5 py-4 border-b border-[#e8f5ea] flex items-center justify-between bg-gradient-to-r from-[#f0faf2] to-white">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-[#1a5c2a]">🆕 New Registrations</h2>
          {/* live pulse dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4caf28] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1a5c2a]" />
          </span>
          <span className="text-xs text-gray-400">Live</span>
        </div>
        <Link href="/admin/users" className="text-xs font-semibold text-[#1a5c2a] bg-[#e8f5ea] hover:bg-[#d1ead3] px-3 py-1.5 rounded-lg transition-all duration-300">
          View All
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="px-5 py-8 text-center text-gray-400 text-sm">
          <p className="text-2xl mb-2">👥</p>
          No new registrations yet. New accounts appear here instantly.
        </div>
      ) : (
        <div className="divide-y divide-[#f0faf2] max-h-72 overflow-y-auto">
          {users.map(u => (
            <div
              key={`${u.user_id}-${u.created_at}`}
              className={`flex items-center gap-3 px-5 py-3 transition-all duration-500 ${
                u.isNew ? 'bg-[#f0faf2] animate-fade-in' : 'hover:bg-[#f9fdf9]'
              }`}
            >
              {/* Avatar initials */}
              <div className="w-9 h-9 rounded-full bg-[#1a5c2a] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {(u.name || u.email).charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.name || '—'}</p>
                  {u.isNew && (
                    <span className="text-[10px] font-bold bg-[#f5c518] text-[#1a1a1a] px-1.5 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>

              <div className="text-right shrink-0">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  u.role === 'journalist' ? 'bg-[#e8f5ea] text-[#1a5c2a]' :
                  u.role === 'admin'      ? 'bg-[#fff8e1] text-[#c8820a]' :
                                           'bg-gray-100 text-gray-500'
                }`}>
                  {roleLabel(u.role)}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(u.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
