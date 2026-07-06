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

// Augment mock with some reader accounts
const EXTRA_READERS: AnyUser[] = [
  { user_id: 10, name: 'David Kim',    email: 'david@example.com', role: 'reader', status: 'active',   created_at: '2024-01-10', bio: null, profile_image: 'https://i.pravatar.cc/40?img=10', password_hash: '', articles: 0, earnings: 0, subscribers: 0 },
  { user_id: 11, name: 'Maria Lopez',  email: 'maria@example.com', role: 'reader', status: 'active',   created_at: '2024-02-03', bio: null, profile_image: 'https://i.pravatar.cc/40?img=11', password_hash: '', articles: 0, earnings: 0, subscribers: 0 },
  { user_id: 12, name: 'James Omondi', email: 'james@example.com', role: 'reader', status: 'inactive', created_at: '2024-02-20', bio: null, profile_image: 'https://i.pravatar.cc/40?img=12', password_hash: '', articles: 0, earnings: 0, subscribers: 0 },
]
const ALL_USERS: AnyUser[] = [...(MOCK_USERS as AnyUser[]), ...EXTRA_READERS]

function getStatusClasses(status: string) {
  if (status === 'active') return 'bg-green-100 text-green-700'
  if (status === 'inactive') return 'bg-yellow-100 text-yellow-700'
  if (status === 'banned') return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-500'
}

export default function AdminUsersPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="Users Management" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: ALL_USERS.length },
            { label: 'Admins', value: ALL_USERS.filter(u => u.role === 'admin').length },
            { label: 'Journalists', value: ALL_USERS.filter(u => u.role === 'journalist').length },
            { label: 'Readers', value: ALL_USERS.filter(u => u.role === 'reader').length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900">All Users</h2>
            <div className="flex gap-2">
              <input
                type="search"
                placeholder="Search users..."
                aria-label="Search users"
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 w-44"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">User</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Role</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Joined</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ALL_USERS.map(u => (
                  <tr key={u.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.profile_image ? (
                          <Image src={u.profile_image} alt={u.name} width={30} height={30} className="rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'journalist' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        u.status === 'active' ? 'bg-green-100 text-green-700' :
                        u.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                        u.status === 'banned' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs text-blue-600 hover:underline">View</button>
                        {u.role !== 'admin' && (
                          <button className="text-xs text-red-500 hover:underline">
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
