'use client'

import { useState, useRef, useEffect } from 'react'

const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys': ['😀','😂','🥹','😍','🤩','😎','🥳','😇','🤔','😏','🙄','😴','🫡','🤯','🥺','😭','😤','🤯','😬','🤝','👍','👎','🙌','👏','🎉','🔥','💯','❤️','💔','✨','💡'],
  'News': ['📰','📰','🗞️','📡','📻','📺','🎙️','💬','🗣️','📢','🔔','⏰','🌍','🌎','🌏','🇰🇪','🏛️','⚖️','💰','📈','📉','🏷️','🔍','📊','🗳️','⚽','🏀','🏈'],
  'Objects': ['🎬','📸','🎵','🎶','📱','💻','⌨️','🖥️','📷','✏️','📝','📌','📎','🔗','✂️','📦','🏷️','🎁','🏆','🎯','🚀','✈️','🚗','🏠','🏗️','⚙️','🔧','💡','🔑','🪙'],
}

interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export function EmojiPicker({ onSelect, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('Smileys')
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const filtered = search
    ? Object.values(EMOJI_CATEGORIES).flat().filter(() => true)
    : EMOJI_CATEGORIES[activeTab] ?? []

  return (
    <div
      ref={ref}
      className="emoji-picker"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: 8,
        background: 'var(--bg-elevated, var(--surface-1))',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 12,
        width: 280,
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        zIndex: 200,
        animation: 'futr-fade-up 0.2s var(--ease-out-expo)',
      }}
    >
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search emoji…"
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg-base, var(--surface-2))',
          color: 'var(--text-primary)',
          fontSize: '0.82rem',
          outline: 'none',
          marginBottom: 8,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, overflowX: 'auto' }}>
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveTab(cat); setSearch('') }}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === cat && !search ? 'var(--primary-light)' : 'transparent',
              color: activeTab === cat && !search ? 'var(--primary)' : 'var(--text-tertiary)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, maxHeight: 180, overflowY: 'auto' }}>
        {filtered.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => onSelect(emoji)}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.15rem',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.transform = 'scale(1.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
