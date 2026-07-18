import type { Metadata } from 'next'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Followers — Author Portal',
}

interface FollowerUser {
  user_id: number
  name: string
  profile_image: string | null
  role: string
}

interface Follower {
  follower_id: number
  created_at: string
  users: FollowerUser
}

export default async function JournalistFollowersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=login_required&redirect=/journalist/followers')

  const { data: rawProfile } = await supabase
    .from('users')
    .select('user_id, name, profile_image, role, follower_count')
    .eq('auth_id', user.id)
    .single()
  const profile = rawProfile as unknown as {
    user_id: number; name: string; profile_image: string | null; role: string; follower_count: number
  } | null
  if (!profile || profile.role !== 'journalist') redirect('/login?error=unauthorized')

  const { data: followers } = await supabase
    .from('user_follows')
    .select('follower_id, created_at, users!inner(user_id, name, profile_image, role)')
    .eq('following_id', profile.user_id)
    .order('created_at', { ascending: false })
    .limit(50)

  const list = (followers ?? []) as unknown as Follower[]

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl shadow-sm p-5 transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <h2 className="font-extrabold mb-1" style={{ color: 'var(--primary)' }}>Followers</h2>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatNumber(profile.follower_count || list.length)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>People following you</p>
          </div>
        </div>

        {/* Followers list */}
        <div className="rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md backdrop-blur-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
            <h2 className="font-extrabold" style={{ color: 'var(--primary)' }}>Your Followers</h2>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Showing {Math.min(list.length, 50)} of {formatNumber(profile.follower_count || list.length)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--bg-muted)', color: 'var(--primary)' }}>
                  <th className="px-4 py-3 text-left">Follower</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Since</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>No followers yet.</td></tr>
                ) : list.map((f) => (
                  <tr key={f.follower_id} className="transition-all duration-300" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {f.users?.profile_image ? (
                          <Image src={f.users.profile_image} alt={f.users.name} width={28} height={28} className="rounded-full object-cover" style={{ border: '2px solid var(--border-subtle)' }} />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'var(--primary)' }}>
                            {(f.users?.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{f.users?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{f.users?.role || 'reader'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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