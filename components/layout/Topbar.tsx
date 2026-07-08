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
    <header className="bg-white border-b border-[#e8f5ea] px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Kenya accent bar + title */}
      <div className="flex items-center gap-3">
        <span className="w-1 h-6 rounded-full bg-gradient-to-b from-[#1a5c2a] to-[#4caf28] shrink-0" />
        <h1 className="text-base font-bold text-[#1a5c2a]">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {children}

        <span className="text-sm text-gray-400 hidden sm:block">
          Welcome, <strong className="text-[#1a5c2a]">{user.name}</strong>
        </span>

        {/* Notification bell */}
        <NotificationBell
          userId={user.user_id ?? 1}
          role={user.role ?? 'journalist'}
        />

        {/* Profile avatar */}
        <Link
          href={user.role === 'admin' ? '/admin/settings' : '/journalist/profile'}
          aria-label="View profile"
          className="transition-transform duration-300 hover:scale-110"
        >
          {user.profile_image ? (
            <Image
              src={user.profile_image}
              alt={user.name}
              width={34}
              height={34}
              className="rounded-full object-cover ring-2 ring-[#e8f5ea] hover:ring-[#f5c518] transition-all duration-300"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1a5c2a] flex items-center justify-center text-white text-sm font-bold ring-2 ring-[#e8f5ea] hover:ring-[#f5c518] transition-all duration-300">
              {user.name.charAt(0)}
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
