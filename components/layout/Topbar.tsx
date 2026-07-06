import Image from 'next/image'
import Link from 'next/link'
import { NotificationBell } from '@/components/ui/NotificationBell'

interface TopbarProps {
  title: string
  user: { name: string; profile_image: string | null; user_id?: number; role?: 'admin' | 'journalist' | 'reader' }
  children?: React.ReactNode
}

export function Topbar({ title, user, children }: TopbarProps) {
  return (
    <header className="bg-[#0a1628] border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <h1 className="text-base font-bold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        {children}
        <span className="text-sm text-white/40 hidden sm:block">
          Welcome, <strong className="text-white/80">{user.name}</strong>
        </span>

        {/* Notification bell — uses real-time via Supabase */}
        <NotificationBell
          userId={user.user_id ?? 1}
          role={user.role ?? 'journalist'}
        />

        {/* Profile */}
        <Link
          href={user.role === 'admin' ? '/admin/settings' : '/journalist/profile'}
          aria-label="View profile"
        >
          {user.profile_image ? (
            <Image
              src={user.profile_image}
              alt={user.name}
              width={34}
              height={34}
              className="rounded-full object-cover ring-2 ring-white/20 hover:ring-orange-500 transition-all"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0)}
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
