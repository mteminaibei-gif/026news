'use client'

import { useState } from 'react'
import { Plus, Send } from 'lucide-react'
import { InviteAuthorModal } from './InviteAuthorModal'

interface InviteAuthorButtonProps {
  authorName?: string
  authorEmail?: string
  variant?: 'button' | 'icon'
  size?: 'sm' | 'md' | 'lg'
}

export function InviteAuthorButton({
  authorName = 'Author',
  authorEmail = '',
  variant = 'button',
  size = 'md',
}: InviteAuthorButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 transition-colors"
          title={`Invite ${authorName}`}
        >
          <Send size={20} />
        </button>
        <InviteAuthorModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          authorName={authorName}
          authorEmail={authorEmail}
        />
      </>
    )
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${sizeClasses[size]} inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-md`}
      >
        <Send size={16} />
        Invite Author
      </button>
      <InviteAuthorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        authorName={authorName}
        authorEmail={authorEmail}
      />
    </>
  )
}
