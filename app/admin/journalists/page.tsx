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
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Topbar title="Authors Management" user={ADMIN} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Authors',  value: journalists.length,                                                    color: 'var(--primary)' },
            { label: 'Active',         value: journalists.filter(j => j.status === 'active').length,                 color: 'var(--primary)' },
            { label: 'Total Articles', value: journalists.reduce((s, j) => s + j.articles, 0),                      color: 'var(--primary)' },
            { label: 'Earnings Paid',  value: `$${journalists.reduce((s, j) => s + j.earnings, 0).toFixed(2)}`,     color: 'var(--warning)' },
          ].map(s => (
            <div key={s.label} className="backdrop-blur-sm rounded-2xl p-4 shadow-sm text-center transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
            <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>All Authors</h2>
            <button className="font-bold px-4 py-2 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
              + Invite Author
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
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
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {journalists.map(j => (
                  <tr key={j.user_id} className="transition-all duration-300" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {j.profile_image ? (
                          <Image src={j.profile_image} alt={j.name} width={32} height={32} className="rounded-full object-cover shrink-0" style={{ boxShadow: '0 0 0 2px var(--border-subtle)' }} />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            {j.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{j.name}</p>
                          <p className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-tertiary)' }}>{j.bio?.substring(0, 40)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{j.email}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: 'var(--primary)' }}>{j.articles}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{j.subscribers.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: 'var(--primary)' }}>${j.earnings.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        j.status === 'active' ? '' :
                        j.status === 'banned' ? '' :
                        ''
                      }`} style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        ...(j.status === 'active' ? { background: 'var(--success-light)', color: 'var(--success)' } :
                          j.status === 'banned' ? { background: 'var(--error-light)', color: 'var(--error)' } :
                          { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' })
                      }}>
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatDate(j.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/journalists/${j.user_id}`} className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
                          View
                        </Link>
                        <button className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all duration-300" style={{ color: 'var(--error)', background: 'var(--error-light)' }}>
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
