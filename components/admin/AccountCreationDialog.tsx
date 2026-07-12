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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Account</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add a reader or author to the platform</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
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
