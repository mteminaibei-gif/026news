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
    <header className="bg-white/90 backdrop-blur-md border-b border-[#e8f5ea] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Left: Kenya accent bar + title */}
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#c8102e] via-[#1a1a1a] to-[#4caf28] shrink-0 shadow-sm" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#1a5c2a] to-[#2d8a47] bg-clip-text text-transparent">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-1 h-1 bg-[#4caf28] rounded-full animate-pulse" />
            <span>Live Dashboard</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {children}

        <span className="text-sm text-gray-600 hidden sm:block font-medium">
          Welcome, <span className="font-bold bg-gradient-to-r from-[#1a5c2a] to-[#4caf28] bg-clip-text text-transparent">{user.name}</span>
        </span>

        {/* Notification bell */}
        <div className="relative">
          <NotificationBell
            userId={user.user_id ?? 1}
            role={user.role ?? 'journalist'}
          />
        </div>

        {/* Profile avatar with enhanced styling */}
        <Link
          href={user.role === 'admin' ? '/admin/settings' : '/journalist/profile'}
          aria-label="View profile"
          className="transition-all duration-300 hover:scale-110 group"
        >
          {user.profile_image ? (
            <div className="relative">
              <Image
                src={user.profile_image}
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full object-cover ring-2 ring-[#e8f5ea] group-hover:ring-[#f5c518] transition-all duration-300 shadow-md"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4caf28] rounded-full border-2 border-white shadow-sm" />
            </div>
          ) : (
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a5c2a] to-[#4caf28] flex items-center justify-center text-white text-sm font-bold ring-2 ring-[#e8f5ea] group-hover:ring-[#f5c518] transition-all duration-300 shadow-md">
                {user.name.charAt(0)}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4caf28] rounded-full border-2 border-white shadow-sm" />
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
