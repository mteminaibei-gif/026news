import type { Metadata } from 'next'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_USERS } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import type { UserRole, AccountStatus } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Users Management — Admin Panel',
}

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!

interface AnyUser {
  user_id: number
  name: string
  email: string
  role: UserRole
  status: AccountStatus
  created_at: string
  bio: string | null
  profile_image: string | null
  password_hash: string
  articles: number
  earnings: number
  subscribers: number
}

const EXTRA_READERS: AnyUser[] = [
  { user_id: 10, name: 'David Kim',    email: 'david@example.com', role: 'reader', status: 'active',   created_at: '2024-01-10', bio: null, profile_image: 'https://i.pravatar.cc/40?img=10', password_hash: '', articles: 0, earnings: 0, subscribers: 0 },
  { user_id: 11, name: 'Maria Lopez',  email: 'maria@example.com', role: 'reader', status: 'active',   created_at: '2024-02-03', bio: null, profile_image: 'https://i.pravatar.cc/40?img=11', password_hash: '', articles: 0, earnings: 0, subscribers: 0 },
  { user_id: 12, name: 'James Omondi', email: 'james@example.com', role: 'reader', status: 'inactive', created_at: '2024-02-20', bio: null, profile_image: 'https://i.pravatar.cc/40?img=12', password_hash: '', articles: 0, earnings: 0, subscribers: 0 },
]
const ALL_USERS: AnyUser[] = [...(MOCK_USERS as AnyUser[]), ...EXTRA_READERS]

export default function AdminUsersPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Topbar title="Users Management" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users',   value: ALL_USERS.length,                                    color: 'var(--primary)' },
            { label: 'Admins',        value: ALL_USERS.filter(u => u.role === 'admin').length,      color: 'var(--warning)' },
            { label: 'Authors',     value: ALL_USERS.filter(u => u.role === 'journalist').length, color: 'var(--primary)' },
            { label: 'Readers',       value: ALL_USERS.filter(u => u.role === 'reader').length,     color: 'var(--primary)' },
          ].map(s => (
            <div key={s.label} className="backdrop-blur-sm rounded-2xl p-4 shadow-sm text-center transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
            <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>All Users</h2>
            <div className="flex gap-2">
              <input
                type="search"
                placeholder="Search users..."
                aria-label="Search users"
                className="rounded-xl px-3 py-1.5 text-sm focus:outline-none w-44 transition-all duration-300"
                style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
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
                {ALL_USERS.map(u => (
                  <tr key={u.user_id} className="transition-all duration-300" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.profile_image ? (
                          <Image src={u.profile_image} alt={u.name} width={30} height={30} className="rounded-full object-cover shrink-0" style={{ boxShadow: '0 0 0 2px var(--border-subtle)' }} />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        ...(u.role === 'admin' ? { background: 'var(--warning-light)', color: 'var(--warning)' } :
                          u.role === 'journalist' ? { background: 'var(--success-light)', color: 'var(--success)' } :
                          { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' })
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        ...(u.status === 'active' ? { background: 'var(--success-light)', color: 'var(--success)' } :
                          u.status === 'inactive' ? { background: 'var(--warning-light)', color: 'var(--warning)' } :
                          u.status === 'banned' ? { background: 'var(--error-light)', color: 'var(--error)' } :
                          { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' })
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
                          View
                        </button>
                        {u.role !== 'admin' && (
                          <button className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300" style={{ color: 'var(--error)', background: 'var(--error-light)' }}>
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
