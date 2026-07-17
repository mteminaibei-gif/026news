'use client'

import { useState, useEffect } from 'react'
import { Share2, Check } from 'lucide-react'

interface Props {
  title: string
  slug: string
}

export function ShareBar({ title, slug }: Props) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  const url = typeof window !== 'undefined'
    ? window.location.href
    : `https://026connet!.vercel.app/article/${slug}`

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true)
    }
  }, [])

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text: `Read this article on 026connet!: ${title}`,
        url,
      })
    } catch (err) {
      console.warn('Native share failed or cancelled:', err)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div
      className="rounded-2xl p-5 mb-6 flex flex-wrap items-center gap-3 transition-colors"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <span className="text-sm font-bold flex items-center gap-1.5 mr-2" style={{ color: 'var(--text-primary)' }}>
        <Share2 size={16} style={{ color: 'var(--primary)' }} />
        Share This Article
      </span>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#1877f2] hover:bg-[#166fe5] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook
      </a>

      {/* X / Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-black hover:bg-neutral-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Post
      </a>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.6.95 2.766 1.48 4.793 1.487 5.466.002 9.917-4.444 9.92-9.913.003-5.468-4.446-9.922-9.923-9.923-5.466 0-9.917 4.445-9.92 9.913-.001 1.95.51 3.85 1.478 5.485L1.87 21.08l4.777-1.926zm11.364-7.412c-.3-.15-1.772-.875-2.046-.975-.276-.1-.477-.15-.677.15-.2.3-.777.975-.95 1.175-.177.2-.35.225-.65.075-.3-.15-1.263-.465-2.403-1.485-.888-.79-1.488-1.77-1.663-2.07-.177-.3-.02-.46.13-.61.136-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.677-1.625-.926-2.225-.244-.588-.493-.507-.677-.517-.174-.01-.375-.012-.576-.012-.2 0-.525.075-.8 1.012-.275.937-.8 2.285-.8 2.385 0 .1.1.2.2.3.1.1 1.953 2.985 4.73 4.178.66.284 1.177.453 1.58.58.665.21 1.27.18 1.75.108.533-.08 1.773-.725 2.023-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z"/>
        </svg>
        WhatsApp
      </a>

      {/* LinkedIn */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#0a66c2] hover:bg-[#0956a3] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
        </svg>
        LinkedIn
      </a>

      {/* Native Share button on mobile */}
      {canShare && (
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-2 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
          style={{ background: 'var(--primary)' }}
        >
          <Share2 size={14} />
          More Share
        </button>
      )}

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs ${
          copied ? '' : ''
        }`}
        style={copied
          ? { background: 'var(--success-light)', color: 'var(--success)' }
          : { background: 'var(--bg-muted)', color: 'var(--text-secondary)' }
        }
      >
        {copied ? (
          <Check size={14} />
        ) : (
          <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
        {copied ? 'Link Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
