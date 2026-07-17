'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, RefreshCw, X, Users as UsersIcon, PenLine, UserX, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { AccountCreationForm } from './AccountCreationForm'

type AdminUser = {
  user_id: number
  name: string | null
  email: string
  role: 'admin' | 'journalist' | 'reader'
  status: 'active' | 'inactive' | 'banned'
  created_at: string
  profile_image: string | null
  article_count: number
  total_views: number
}

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  admin: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  journalist: { bg: 'var(--success-light)', color: 'var(--success)' },
  reader: { bg: 'var(--bg-muted)', color: 'var(--text-tertiary)' },
}
const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  active: { bg: 'var(--success-light)', color: 'var(--success)' },
  inactive: { bg: 'var(--warning-light)', color: 'var(--warning)' },
  banned: { bg: 'var(--error-light)', color: 'var(--error)' },
}

export function UserManagementTable() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, admins: 0, journalists: 0, readers: 0, active: 0 })
  const [busyId, setBusyId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.set('role', roleFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (q) params.set('q', q)
      params.set('page', String(page))
      params.set('limit', '25')
      const res = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')
      setError(null)
      setUsers(data.users ?? [])
      setTotalPages(data.totalPages ?? 1)
      if (data.stats) setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, q, roleFilter, statusFilter])

  useEffect(() => {
    // Data-fetch effect: setState happens inside async callbacks, not synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  // Realtime: refresh whenever any user row changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        load()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  const patchUser = useCallback(
    async (user_id: number, payload: { role?: string; status?: string }) => {
      setBusyId(user_id)
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id, ...payload }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Update failed')
        setUsers(prev => prev.map(u => (u.user_id === user_id ? { ...u, ...data.user } : u)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed')
        load()
      } finally {
        setBusyId(null)
      }
    },
    [load]
  )

  const filtered = users

  const inputStyle = {
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 14,
    outline: 'none',
  } as const

  return (
    <div
      className="rounded-2xl shadow-lg overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Header + stats */}
      <div
        className="px-5 py-4 flex flex-wrap items-center justify-between gap-4"
        style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}
      >
        <div className="flex items-center gap-2">
          <UsersIcon size={18} style={{ color: 'var(--primary)' }} />
          <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>User Management</h2>
          <span
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--success-light)', color: 'var(--success)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            Live
          </span>
        </div>
        <button
          onClick={() => setShowCreate(s => !s)}
          className="flex items-center gap-2 font-bold px-3.5 py-2 rounded-lg transition-all text-sm"
          style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))', color: 'var(--text-inverse)' }}
        >
          <Plus size={16} /> Create Account
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px" style={{ background: 'var(--border-subtle)' }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--primary)' },
          { label: 'Admins', value: stats.admins, color: 'var(--warning)' },
          { label: 'Authors', value: stats.journalists, color: 'var(--success)' },
          { label: 'Readers', value: stats.readers, color: 'var(--text-tertiary)' },
          { label: 'Active', value: stats.active, color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 text-center" style={{ background: 'var(--bg-surface)' }}>
            <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="px-5 py-3 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="Search name or email…"
            aria-label="Search users"
            className="w-full pl-9 pr-3 py-2 text-sm focus:outline-none transition-all"
            style={inputStyle}
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }} aria-label="Filter by role" style={inputStyle}>
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="journalist">Author</option>
          <option value="reader">Reader</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} aria-label="Filter by status" style={inputStyle}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
        <button
          onClick={() => load()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="px-5 py-2 text-sm" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {showCreate && (
        <div className="p-5" style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>Create New Account</h4>
            <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-tertiary)' }} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <AccountCreationForm onSuccess={() => setShowCreate(false)} onClose={() => setShowCreate(false)} />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {filtered.map(u => (
              <tr key={u.user_id} className="transition-all duration-200 hover:bg-[var(--bg-muted)]" style={{ borderColor: 'var(--border-subtle)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {u.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.profile_image} alt={u.name ?? ''} width={32} height={32} className="rounded-full object-cover shrink-0" style={{ border: '2px solid var(--border-subtle)' }} />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        {(u.name ?? u.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.name ?? '—'}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{u.article_count ?? 0} articles · {(u.total_views ?? 0).toLocaleString()} views</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs max-w-[200px] truncate" style={{ color: 'var(--text-tertiary)' }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: ROLE_BADGE[u.role].bg, color: ROLE_BADGE[u.role].color }}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: STATUS_BADGE[u.status].bg, color: STATUS_BADGE[u.status].color }}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={u.role}
                      disabled={busyId === u.user_id || u.role === 'admin'}
                      onChange={e => patchUser(u.user_id, { role: e.target.value })}
                      aria-label="Change role"
                      className="text-xs font-semibold px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                      style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      <option value="reader">Reader</option>
                      <option value="journalist">Author</option>
                      <option value="admin">Admin</option>
                    </select>

                    {u.status === 'active' ? (
                      <button
                        onClick={() => patchUser(u.user_id, { status: 'inactive' })}
                        disabled={busyId === u.user_id || u.role === 'admin'}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all disabled:opacity-40"
                        style={{ color: 'var(--warning)', background: 'var(--warning-light)' }}
                      >
                        <UserX size={13} /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => patchUser(u.user_id, { status: 'active' })}
                        disabled={busyId === u.user_id}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all disabled:opacity-40"
                        style={{ color: 'var(--success)', background: 'var(--success-light)' }}
                      >
                        <UserCheck size={13} /> Activate
                      </button>
                    )}

                    {u.role === 'journalist' ? (
                      <Link
                        href={`/journalists/${u.user_id}`}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                        style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}
                      >
                        <PenLine size={13} /> View
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg opacity-40" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-muted)' }}>
                        View
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  No users match your filters.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Loading users…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        className="flex items-center justify-between px-5 py-3 text-sm"
        style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}
      >
        <span style={{ color: 'var(--text-tertiary)' }}>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
            style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
            style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
