'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { AccountCreationForm } from './AccountCreationForm'

interface AccountCreationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: any) => void
}

export function AccountCreationDialog({ isOpen, onClose, onSuccess }: AccountCreationDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create New Account</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Add a reader or author to the platform</p>
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AccountCreationForm
            onSuccess={(user) => {
              if (onSuccess) onSuccess(user)
              onClose()
            }}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  )
}
