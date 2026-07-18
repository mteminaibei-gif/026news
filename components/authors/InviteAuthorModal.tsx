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

  const inviteMessage = `Join 026connet! as an author and start earning from your stories! Sign up and begin publishing today. ${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding?ref=invite`

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding?ref=journalist_invite`

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
    const subject = encodeURIComponent('Invite: Join 026connet! as an Author')
    const body = encodeURIComponent(
      `Hi ${authorName},\n\n${inviteMessage}\n\nBest regards,\n026connet! Team`
    )
    const url = `mailto:${authorEmail}?subject=${subject}&body=${body}`
    window.open(url)
    setSelectedMethod('email')
  }

  const handleTwitter = () => {
    const text = encodeURIComponent(`I'm inviting you to join @026connet! as an author! Share your stories and start earning. ${inviteLink}`)
    const url = `https://twitter.com/intent/tweet?text=${text}`
    window.open(url, '_blank')
    setSelectedMethod('twitter')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-2xl shadow-2xl max-w-md w-full mx-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Invite {authorName}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Share the author signup link</p>
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invite Link */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Author Signup Link
            </label>
            <div className="flex gap-2">
              <input type="text" value={inviteLink} readOnly
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-muted)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} />
              <button onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${copied ? 'text-white' : ''}`}
                style={{
                  background: copied ? 'var(--success)' : 'var(--bg-muted)',
                  color: copied ? '#fff' : 'var(--text-primary)',
                }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Media Options */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Send via:
            </label>
            <div className="space-y-2">
              {/* WhatsApp */}
              <button onClick={handleWhatsApp}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
                style={{
                  border: `2px solid ${selectedMethod === 'whatsapp' ? 'var(--success)' : 'var(--border)'}`,
                  background: selectedMethod === 'whatsapp' ? 'var(--success-light)' : 'transparent',
                }}>
                <MessageCircle size={20} className="text-green-600" />
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>WhatsApp</span>
              </button>

              {/* Email */}
              <button onClick={handleEmail}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
                style={{
                  border: `2px solid ${selectedMethod === 'email' ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedMethod === 'email' ? 'var(--primary-light)' : 'transparent',
                }}>
                <Mail size={20} className="text-blue-600" />
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Email</span>
              </button>

              {/* Twitter */}
              <button onClick={handleTwitter}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all"
                style={{
                  border: `2px solid ${selectedMethod === 'twitter' ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedMethod === 'twitter' ? 'var(--primary-light)' : 'transparent',
                }}>
                <span className="text-xl">𝕏</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Twitter / X</span>
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Message Preview
            </label>
            <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
              {inviteMessage}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose}
            className="w-full px-4 py-2 font-medium rounded-lg transition-all"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
