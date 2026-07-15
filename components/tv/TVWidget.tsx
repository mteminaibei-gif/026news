'use client'

import { useState } from 'react'
import { useTV } from './TVProvider'

export function TVWidget() {
  const { currentStation, isPlaying, stop } = useTV()
  const [minimized, setMinimized] = useState(false)

  if (!currentStation) return null

  return (
    <div
      className="fixed z-50 shadow-2xl transition-all duration-300"
      style={{
        bottom: minimized ? 16 : 16,
        right: 16,
        width: minimized ? 200 : 420,
        maxWidth: 'calc(100vw - 32px)',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#000',
        border: `2px solid ${currentStation.color}`,
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: currentStation.color }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '1rem' }}>{currentStation.logo}</span>
          <span className="text-white font-bold text-sm truncate">{currentStation.name}</span>
          <span className="flex items-center gap-1 text-white/80 text-[10px] font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors"
            aria-label={minimized ? 'Expand' : 'Minimize'}
          >
            {minimized ? '⤢' : '⤡'}
          </button>
          <button
            onClick={stop}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Video embed */}
      {isPlaying && !minimized && (
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={currentStation.streamUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`Live: ${currentStation.name}`}
          />
        </div>
      )}

      {/* Minimized thumbnail */}
      {isPlaying && minimized && (
        <div
          className="relative flex items-center justify-center"
          style={{ height: 80, background: `linear-gradient(135deg, ${currentStation.color} 0%, ${currentStation.color}88 100%)` }}
        >
          <span style={{ fontSize: '2rem' }}>📺</span>
          <div className="absolute bottom-1 left-2 text-white/80 text-[10px] font-semibold">
            {currentStation.genre}
          </div>
        </div>
      )}

      {/* Station info bar */}
      {!minimized && (
        <div className="px-3 py-2" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{currentStation.name}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{currentStation.genre} · {currentStation.viewers.toLocaleString()} watching</p>
        </div>
      )}
    </div>
  )
}
