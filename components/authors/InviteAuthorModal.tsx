'use client'

import { useState } from 'react'
import { X, Share2, MessageCircle, Mail } from 'lucide-react'

interface InviteAuthorModalProps {
  isOpen: boolean
  onClose: () => void
  authorName?: string
  authorEmail?: string
}

export function InviteAuthorModal({ isOpen, onClose, authorName = 'Author', authorEmail = '' }: InviteAuthorModalProps) {
  const [copied, setCopied] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'whatsapp' | 'email' | 'twitter' | null>(null)

  if (!isOpen) return null

  const inviteMessage = `Join 026NEWS as a journalist and start earning from your stories! Sign up and begin publishing today. ${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=invite`

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=journalist_invite`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(inviteMessage)
    const url = `https://wa.me/?text=${message}`
    window.open(url, '_blank')
    setSelectedMethod('whatsapp')
  }

  const handleEmail = () => {
    const subject = encodeURIComponent('Invite: Join 026NEWS as a Journalist')
    const body = encodeURIComponent(
      `Hi ${authorName},\n\n${inviteMessage}\n\nBest regards,\n026NEWS Team`
    )
    const url = `mailto:${authorEmail}?subject=${subject}&body=${body}`
    window.open(url)
    setSelectedMethod('email')
  }

  const handleTwitter = () => {
    const text = encodeURIComponent(`I'm inviting you to join @026News as a journalist! Share your stories and start earning. ${inviteLink}`)
    const url = `https://twitter.com/intent/tweet?text=${text}`
    window.open(url, '_blank')
    setSelectedMethod('twitter')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invite {authorName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Share the journalist signup link</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invite Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Journalist Signup Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300'
                }`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Media Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Send via:
            </label>
            <div className="space-y-2">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  selectedMethod === 'whatsapp'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-500'
                }`}
              >
                <MessageCircle size={20} className="text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">WhatsApp</span>
              </button>

              {/* Email */}
              <button
                onClick={handleEmail}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  selectedMethod === 'email'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500'
                }`}
              >
                <Mail size={20} className="text-blue-600" />
                <span className="font-medium text-gray-900 dark:text-white">Email</span>
              </button>

              {/* Twitter */}
              <button
                onClick={handleTwitter}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  selectedMethod === 'twitter'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-sky-500'
                }`}
              >
                <span className="text-xl">𝕏</span>
                <span className="font-medium text-gray-900 dark:text-white">Twitter / X</span>
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Message Preview
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              {inviteMessage}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
