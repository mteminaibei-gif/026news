import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_USERS, MOCK_ARTICLES } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Journalists Management — Admin Panel',
}

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!

export default function AdminJournalistsPage() {
  const journalists = MOCK_USERS.filter(u => u.role === 'journalist')

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="Journalists Management" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Journalists', value: journalists.length },
            { label: 'Active', value: journalists.filter(j => j.status === 'active').length },
            { label: 'Total Articles', value: journalists.reduce((s, j) => s + j.articles, 0) },
            { label: 'Total Earnings Paid', value: `$${journalists.reduce((s, j) => s + j.earnings, 0).toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl font-extrabold text-gray-800">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-extrabold text-gray-900">All Journalists</h2>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
              + Invite Journalist
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">Journalist</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Articles</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Subscribers</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Earnings</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Joined</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {journalists.map(j => (
                  <tr key={j.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Image src={j.profile_image ?? ''} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-800">{j.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[120px]">{j.bio?.substring(0, 40)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{j.email}</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">{j.articles}</td>
                    <td className="px-4 py-3 text-gray-700">{j.subscribers.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600 font-bold">${j.earnings.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        j.status === 'active' ? 'bg-green-100 text-green-700' :
                        j.status === 'banned' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(j.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/journalists/${j.user_id}`} className="text-xs text-blue-600 hover:underline font-medium">View</Link>
                        <button className="text-xs text-red-500 hover:underline font-medium">Suspend</button>
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
