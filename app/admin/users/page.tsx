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
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title="Users Management" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users',   value: ALL_USERS.length,                                    color: 'text-[#1a5c2a]' },
            { label: 'Admins',        value: ALL_USERS.filter(u => u.role === 'admin').length,      color: 'text-[#f5c518]' },
            { label: 'Journalists',   value: ALL_USERS.filter(u => u.role === 'journalist').length, color: 'text-[#1a5c2a]' },
            { label: 'Readers',       value: ALL_USERS.filter(u => u.role === 'reader').length,     color: 'text-[#1a5c2a]' },
          ].map(s => (
            <div key={s.label} className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl p-4 shadow-sm text-center transition-all duration-300 hover:shadow-md">
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="px-5 py-4 border-b border-[#e8f5ea] flex items-center justify-between bg-gradient-to-r from-[#f0faf2] to-white">
            <h2 className="font-extrabold text-[#1a5c2a]">All Users</h2>
            <div className="flex gap-2">
              <input
                type="search"
                placeholder="Search users..."
                aria-label="Search users"
                className="border border-[#e8f5ea] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-[#4caf28] focus:ring-2 focus:ring-[#4caf28]/20 w-44 transition-all duration-300"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0faf2]">
                {ALL_USERS.map(u => (
                  <tr key={u.user_id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.profile_image ? (
                          <Image src={u.profile_image} alt={u.name} width={30} height={30} className="rounded-full object-cover shrink-0 ring-2 ring-[#e8f5ea]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#e8f5ea] flex items-center justify-center text-xs font-bold text-[#1a5c2a] shrink-0">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin'      ? 'bg-[#fff8e1] text-[#c8820a]' :
                        u.role === 'journalist' ? 'bg-[#e8f5ea] text-[#1a5c2a]' :
                                                  'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.status === 'active'   ? 'bg-[#e8f5ea] text-[#1a5c2a]' :
                        u.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                        u.status === 'banned'   ? 'bg-[#fde8e8] text-[#c8102e]' :
                                                  'bg-gray-100 text-gray-500'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs font-semibold text-[#1a5c2a] bg-[#e8f5ea] hover:bg-[#d1ead3] px-2.5 py-1 rounded-lg transition-all duration-300">
                          View
                        </button>
                        {u.role !== 'admin' && (
                          <button className="text-xs font-semibold text-[#c8102e] bg-[#fde8e8] hover:bg-[#fbd0d0] px-2.5 py-1 rounded-lg transition-all duration-300">
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
