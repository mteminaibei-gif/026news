import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_USERS, MOCK_ARTICLES } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Authors Management — Admin Panel',
}

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!

export default function AdminJournalistsPage() {
  const journalists = MOCK_USERS.filter(u => u.role === 'journalist')

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title="Journalists Management" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Authors',  value: journalists.length,                                                    color: 'text-[#1a5c2a]' },
            { label: 'Active',         value: journalists.filter(j => j.status === 'active').length,                 color: 'text-[#1a5c2a]' },
            { label: 'Total Articles', value: journalists.reduce((s, j) => s + j.articles, 0),                      color: 'text-[#1a5c2a]' },
            { label: 'Earnings Paid',  value: `$${journalists.reduce((s, j) => s + j.earnings, 0).toFixed(2)}`,     color: 'text-[#f5c518]' },
          ].map(s => (
            <div key={s.label} className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl p-4 shadow-sm text-center transition-all duration-300 hover:shadow-md">
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="px-5 py-4 border-b border-[#e8f5ea] flex items-center justify-between bg-gradient-to-r from-[#f0faf2] to-white">
            <h2 className="font-extrabold text-[#1a5c2a]">All Authors</h2>
            <button className="bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              + Invite Author
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0faf2] text-xs text-[#1a5c2a] font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Author</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Articles</th>
                  <th className="px-4 py-3 text-left">Subscribers</th>
                  <th className="px-4 py-3 text-left">Earnings</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0faf2]">
                {journalists.map(j => (
                  <tr key={j.user_id} className="hover:bg-[#f9fdf9] transition-all duration-300">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {j.profile_image ? (
                          <Image src={j.profile_image} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0 ring-2 ring-[#e8f5ea]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#e8f5ea] flex items-center justify-center text-xs font-bold text-[#1a5c2a] shrink-0">
                            {j.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{j.name}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">{j.bio?.substring(0, 40)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{j.email}</td>
                    <td className="px-4 py-3 text-[#1a5c2a] font-bold">{j.articles}</td>
                    <td className="px-4 py-3 text-gray-700">{j.subscribers.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#1a5c2a] font-bold">${j.earnings.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        j.status === 'active' ? 'bg-[#e8f5ea] text-[#1a5c2a]' :
                        j.status === 'banned' ? 'bg-[#fde8e8] text-[#c8102e]' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(j.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/journalists/${j.user_id}`} className="text-xs font-semibold text-[#1a5c2a] bg-[#e8f5ea] hover:bg-[#d1ead3] px-2.5 py-1 rounded-lg transition-all duration-300">
                          View
                        </Link>
                        <button className="text-xs font-semibold text-[#c8102e] bg-[#fde8e8] hover:bg-[#fbd0d0] px-2.5 py-1 rounded-lg transition-all duration-300">
                          Suspend
                        </button>
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
