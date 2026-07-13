'use client'

import Link from 'next/link'
import { useRadio } from './RadioProvider'

export function RadioWidget() {
  const { currentStation, isPlaying, volume, status, error, toggle, setVolume, stop } = useRadio()

  if (!currentStation) {
    return (
      <Link
        href="/radio"
        aria-label="Listen to live radio"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'var(--primary)' }}
      >
        <span style={{ fontSize: '1.1rem' }}>📻</span>
        <span className="hidden sm:inline">Listen Live</span>
      </Link>
    )
  }

  const color = currentStation.color

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl border p-3 shadow-xl sm:left-auto sm:right-4 sm:w-80"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
    >
      {/* Art */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)` }}
      >
        📻
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {currentStation.name}
          </p>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
            style={{
              background: status === 'error' ? 'var(--error)' : '#ef4444',
              color: '#fff',
            }}
          >
            {status === 'error' ? 'OFFLINE' : 'LIVE'}
          </span>
        </div>
        <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
          {status === 'loading' ? 'Connecting…' : status === 'error' ? error : currentStation.genre}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform active:scale-90"
          style={{ background: color }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Volume"
          className="hidden w-16 sm:block"
          style={{ accentColor: color }}
        />

        <Link
          href="/radio"
          aria-label="Open radio page"
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          ℹ️
        </Link>

        <button
          onClick={stop}
          aria-label="Stop radio"
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
