'use client'

import { useState, useEffect } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface Props {
  title: string
  slug: string
}

export function ShareBar({ title, slug }: Props) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const url = typeof window !== 'undefined'
    ? window.location.href
    : `https://026connet!.vercel.app/article/${slug}`

  const shareText = `Read this article on 026connet!: ${title}`

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true)
    }
  }, [])

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: shareText, url })
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

  const handleExpand = () => setExpanded(!expanded)

  return (
    <div
      className="rounded-2xl p-5 mb-6 flex flex-wrap items-center gap-3 transition-colors"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <span className="text-sm font-bold flex items-center gap-1.5 mr-2" style={{ color: 'var(--text-primary)' }}>
        <Share2 size={16} style={{ color: 'var(--primary)' }} />
        Share This Article
      </span>

      {/* Primary row: Facebook, X, WhatsApp, LinkedIn */}
      <div className="flex flex-wrap items-center gap-2">
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
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + url)}`}
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

        {/* Expand/Collapse */}
        <button
          onClick={handleExpand}
          className="flex items-center gap-2 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
          style={{ background: 'var(--primary)' }}
        >
          <Share2 size={14} />
          {expanded ? 'Less' : 'More'}
        </button>
      </div>

      {/* Expanded row: Telegram, Telegram Channel, Reddit, Pinterest, Email, SMS, Native Share, Copy Link */}
      {expanded && (
        <div className="flex flex-wrap items-center gap-2 w-full pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M11.944 22.32c-3.827.353-7.346-1.587-9.26-4.892-.11-.19-.06-.45.11-.57 2.98-2.039 4.03-4.54 4.54-5.575.52-1.04 2.318-1.04 2.83 0 .453.9.828 1.79.828 2.683 0 2.458-1.582 3.67-3.5 4.72v2.72c0 1.99-.67 3.43-1.55 4.59-.34.45-.22 1.12.18 1.38.27.18.8.23 1.16.12C15.066 22.093 18.33 21.5 20.59 20.5c2.28-.9 3.88-3 4.51-5.43.53-2.06.68-4.26.39-6.27-.09-.65-.2-1.27-.43-1.87-.32-2.24.33-3.94 1.87-4.6 4.4-.48 1.73-1.19 3.53-.7 5.08.5 1.6 2.26 2.66 3.94 2.37 1.17-.2 2.07-1.04 2.43-2.1.36-1.07.24-2.18-.18-3.1-.25-.54-.65-1.07-1.1-1.52-.45-.45-1.1-.72-1.84-.58-.73.14-1.36.46-1.88.89-.57.48-1.02 1.15-1.2 1.9-.18.7-.06 1.48.23 2.1.2.4.5.84.9 1.2.6.54 1.38.94 2.28.96.55.02 1.1-.06 1.6-.3.75-.37 1.2-1.04 1.38-1.88.16-.74-.15-1.44-.6-1.98-.5-.58-1.16-.95-1.9-.95-.72 0-1.36.34-1.75.83-.4.5-.58 1.1-.58 1.73v.75c0 1.07-.25 2.03-.75 2.8-.63 1.02-1.7 1.9-3.16 2.38-1.25.4-2.6.42-3.9.12-.48-.1-.94-.25-1.39-.37-1.18-.3-2.27-.4-3.2-.27-.98.14-1.77.8-2.1 1.8-.18.5-.22 1.04-.12 1.53.12.6.5 1.15 1.07 1.58 1.33 1 3.06.8 4.56.27.8-.27 1.5-.68 2.12-1.23.68-.58 1.1-1.28 1.1-2.15 0-.8-.33-1.5-.88-2.1-.54-.54-1.3-.86-2.16-.96-1.3-.15-2.76-.04-4.15.46-.56.18-1.06.4-1.5.7-.5.36-.9.84-1.2 1.44-.3.6-.4 1.28-.3 1.9.1.6.53 1.15 1.07 1.6.5.4 1.1.65 1.8.5 1.2-.2 2.1-1 2.6-2.2.38-.8.37-1.65.12-2.4-.24-.78-.83-1.38-1.55-1.8-.72-.42-1.55-.65-2.4-.65-.85 0-1.56.2-2.15.58-.6.4-.97 1-.97 1.65v2.5c0 1.27-.24 2.3-.7 3.1-.23.4-.08.88.23 1.18.19.19.6.18.83-.07 1.18-1.27 1.6-2.7 1.6-4.3 0-1.8-.85-3.3-2.2-4.2-.65-.4-1.4-.5-2.2-.25-.4.14-.7.35-.97.62-.53.54-.78 1.2-.7 1.9.1.7.5 1.3 1.07 1.66.7.43 1.6.4 2.55.1 1.2-.4 2-1.35 2.37-2.5.18-.54.1-1.1-.12-1.64-.26-.6-.65-1.1-1.1-1.5-.45-.4-1.1-.5-1.7-.2-.48.2-.8.56-1.03.95-.23.4-.33.83-.28 1.26.05.4.23.78.55 1.08.5.5 1.2.8 2 .8 1.1 0 2.1-.4 2.8-1.2.7-.8 1.05-1.86 1.05-3.1v-2.6c0-1.67.3-3.07.9-4.2.76-1.4 2.07-2.44 3.8-3.08.64-.23 1.28-.4 1.9-.5.65-.1 1.3-.1 1.9.1.95.05.43.1.8.3 1.1.55.3.25.5.6.5 1.03 0 .5-.34.9-.85 1.2-.5.3-1.15.3-1.8.03-.6-.25-1.1-.6-1.45-1.1-.3-.4-.45-.85-.4-1.3.05-.5.23-.95.5-1.3.3-.35.7-.6 1.1-.7.4-.1.78-.05 1.12.15.35.2.64.5.8.88.2.4.2 1.05.03 1.5-.22.56-.7 1.07-1.2 1.53-.4.35-.68.7-1.05.7-.26 0-.6-.05-.83-.15z"/>
            </svg>
            Telegram
          </a>

          {/* Reddit */}
          <a
            href={`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#ff4500] hover:bg-[#e03d00] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 11.78c0-1.56-.96-2.93-2.4-3.3.14-.3.14-.64.14-.98 0-.6-.26-1.12-.75-1.5-.42-.32-.93-.5-1.5-.5s-1.07.18-1.5.5c-.48.38-.75.9-.75 1.5 0 .34 0 .68.14.98-1.44.37-2.4 1.74-2.4 3.3 0 1.73 1.36 3.1 3.03 3.14-.04.25-.15.49-.38.68l-1.53 1.27c-.57.47-1.19.98-1.71 1.33-.04-.22-.1-.44-.1-.66 0-.6.26-1.12.75-1.5.42-.32.93-.5 1.5-.5s1.07.18 1.5.5c.48.38.75.9.75 1.5 0 .34 0 .68-.14.98 1.44.37 2.4 1.74 2.4 3.3 0 .33-.1.64-.26.88-.25.38-.63.67-1.04.85l-2.47 1.15c-.45.21-.95.37-1.48.47-.02.34-.03.66-.03 1s.01.66.03 1c.53.1 1.03.26 1.48.47l2.47 1.15c.4.18.78.47 1.04.85.16.24.26.58.26.92 0 1.66-1.36 3.03-3.03 3.14-.26-.1-.5-.34-.68-.59l-1.54-1.26c-.23-.19-.47-.43-.68-.69 1.56-.1 2.88-1.24 3.03-2.9.04-.25.15-.49.38-.69l1.54-1.27c.57-.47 1.19-.98 1.71-1.33.04.22.1.44.1.66 0 .6-.26 1.12-.75 1.5-.42.32-.93.5-1.5.5s-1.07-.18-1.5-.5c-.48-.38-.75-.9-.75-1.5 0-.34 0-.68.14-.98-1.44-.37-2.4-1.74-2.4-3.3zm-10.5 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm12 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
            </svg>
            Reddit
          </a>

          {/* Pinterest */}
          <a
            href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#e60023] hover:bg-[#c40020] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.62 11.17-.1.08-.17.21-.15.33.05.25.17.38.37.27 2.6-1.26 4.5-4.43 4.5-7.58 0-4.54-3.47-8.46-8-8.46-5.04 0-8.6 4.12-8.6 9.22 0 2.18.7 4.08 1.83 5.48-.14.28-.27.6-.36.93-.14.52-.06 1.1.12 1.5.2.4.47.75.87 1 .4.25.88.12 1.15-.15.2-.25.3-.6.25-.9-.1-.4-.27-.8-.27-1.2 0-.42.22-.8.57-1.08 2.76-2.22 5.2-4.76 5.2-8.96 0-5.46-4.28-9.88-10-9.88-5.95 0-10.5 4.54-10.5 10.52 0 5.16 3.25 9.43 8.28 11.02.07.03.1.05.13.07.23-.32.44-.67.57-1.04.1-.27.15-.5.06-.75-.14-.4-.4-.7-.77-.85-.04-.02-.1-.05-.15-.07-.28.4-.5.8-.8 1.25-.12.18-.25.35-.36.5-.1.16-.15.3-.1.45 0 .14.03.26.05.33.05.2.15.45.4.55.4.2 1 .2 1.5.2 1.5 0 2.5-2.5 2.5-2.5H12C5.4 24 0 18.6 0 12S5.4 0 12 0z"/>
            </svg>
            Pinterest
          </a>

          {/* Email */}
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + '\n\n' + url)}`}
            className="flex items-center gap-2 bg-[#ea4335] hover:bg-[#d33a2c] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Email
          </a>

          {/* SMS */}
          <a
            href={`sms:?body=${encodeURIComponent(shareText + '\n\n' + url)}`}
            className="flex items-center gap-2 bg-[#34a853] hover:bg-[#2d9447] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M6.5 4v16h11V4h-11zm0 1.5h11v13h-11v-13zm9 3.5h-7v1h7v-1zm0 2.5h-7v1h7v-1zm0 2.5h-7v1h7v-1zm0 2.5h-7v1h7v-1z"/>
            </svg>
            SMS
          </a>

          {/* Native Share */}
          {canShare && (
            <button
              onClick={handleNativeShare}
              className="flex items-center gap-2 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] shadow-xs"
              style={{ background: 'var(--primary)' }}
            >
              <Share2 size={14} />
              Native Share
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
              <Copy size={14} />
            )}
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  )
}
