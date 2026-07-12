'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

interface Station {
  name: string
  genre: string
  live: boolean
  listeners: number
  color: string
}

interface Podcast {
  title: string
  author: string
  episodes: number
  duration: string
  coverColor: string
}

const STATIONS: Station[] = [
  { name: 'Capital FM Kenya', genre: 'Top 40 / Pop', live: true, listeners: 12400, color: '#e11d48' },
  { name: 'Kiss FM', genre: 'Contemporary Hit Radio', live: true, listeners: 9800, color: '#7c3aed' },
  { name: 'Homeboyz Radio', genre: 'Hip Hop / R&B', live: true, listeners: 7200, color: '#ea580c' },
  { name: 'Classic 105', genre: 'Classic Hits', live: false, listeners: 5400, color: '#0891b2' },
  { name: 'Radio Jambo', genre: 'Genge / Local', live: true, listeners: 11200, color: '#16a34a' },
  { name: 'Nairobi Radio', genre: 'Talk / News', live: true, listeners: 4300, color: '#2563eb' },
  { name: 'Metro FM', genre: 'Urban / Afrobeats', live: false, listeners: 6100, color: '#d946ef' },
  { name: 'Kameme FM', genre: 'Kikuyu / Local', live: true, listeners: 8900, color: '#ca8a04' },
  { name: 'Radio Maisha', genre: 'Swahili / Entertainment', live: true, listeners: 10500, color: '#dc2626' },
]

const PODCASTS: Podcast[] = [
  { title: 'The Daily Brief', author: 'Capital FM', episodes: 324, duration: '28 min', coverColor: '#e11d48' },
  { title: 'Kenya Talk', author: 'Nairobi Radio', episodes: 156, duration: '45 min', coverColor: '#2563eb' },
  { title: 'Tech Pulse Africa', author: 'Kiss FM', episodes: 89, duration: '35 min', coverColor: '#7c3aed' },
  { title: 'Sports Zone', author: 'Homeboyz Radio', episodes: 210, duration: '40 min', coverColor: '#ea580c' },
  { title: 'Morning Vibes', author: 'Radio Jambo', episodes: 445, duration: '55 min', coverColor: '#16a34a' },
  { title: 'Business Today', author: 'Classic 105', episodes: 178, duration: '32 min', coverColor: '#0891b2' },
]

const RECENTLY_PLAYED = [
  { title: 'Kenya Talk: Episode 156', station: 'Nairobi Radio', time: '2h ago' },
  { title: 'Tech Pulse: AI in Africa', station: 'Kiss FM', time: '5h ago' },
  { title: 'Sports Zone: Premier League Review', station: 'Homeboyz Radio', time: '1d ago' },
  { title: 'Morning Vibes: Tuesday Edition', station: 'Radio Jambo', time: '2d ago' },
]

export default function RadioPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(75)
  const [progress, setProgress] = useState(0)
  const [currentStation, setCurrentStation] = useState<Station>(STATIONS[0])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <Navbar />

      <style>{`
        @keyframes waveform {
          0%, 100% { height: 6px; }
          50% { height: 28px; }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes eqBar1 { 0%, 100% { height: 4px; } 50% { height: 18px; } }
        @keyframes eqBar2 { 0%, 100% { height: 8px; } 50% { height: 14px; } }
        @keyframes eqBar3 { 0%, 100% { height: 6px; } 50% { height: 22px; } }
        @keyframes eqBar4 { 0%, 100% { height: 10px; } 50% { height: 16px; } }
        @keyframes eqBar5 { 0%, 100% { height: 5px; } 50% { height: 20px; } }
      `}</style>

      <main className="flex-1">
        {/* Page Header */}
        <section
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            padding: 'var(--space-3xl) 0',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', paddingInline: 'var(--space-lg)' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-sm)' }}>
              <span style={{ fontSize: '2rem' }}>{'\u{1F3B5}'}</span>
              <h1
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  fontFamily: "'Newsreader', Georgia, serif",
                }}
              >
                Radio & Podcasts
              </h1>
            </div>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', maxWidth: '600px' }}>
              Listen to Kenya&apos;s top radio stations and podcasts
            </p>
          </div>
        </section>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-lg)' }}>
          {/* Now Playing Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '20px',
              padding: 'var(--space-xl)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)',
              marginBottom: 'var(--space-2xl)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--space-2xl)', alignItems: 'center' }}>
              {/* Album Art */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '240px',
                    height: '240px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${currentStation.color} 0%, ${currentStation.color}88 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 32px ${currentStation.color}44`,
                  }}
                >
                  <span style={{ fontSize: '4rem', filter: 'grayscale(0)' }}>{'\u{1F3B5}'}</span>
                </div>
                {/* Waveform */}
                <div
                  className="flex items-end justify-center gap-[3px]"
                  style={{
                    position: 'absolute',
                    bottom: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-surface)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '3px',
                        borderRadius: '3px',
                        background: currentStation.color,
                        animation: isPlaying
                          ? `${['eqBar1', 'eqBar2', 'eqBar3', 'eqBar4', 'eqBar5', 'eqBar3', 'eqBar2', 'eqBar1', 'eqBar4'][i]} ${0.4 + i * 0.1}s ease-in-out infinite`
                          : 'none',
                        height: isPlaying ? undefined : '4px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Player Info */}
              <div>
                <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-sm)' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Newsreader', Georgia, serif" }}>
                    {currentStation.name}
                  </h2>
                  {currentStation.live && (
                    <span
                      className="flex items-center gap-1"
                      style={{
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          animation: 'livePulse 1.5s ease-in-out infinite',
                        }}
                      />
                      LIVE
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                  {currentStation.genre}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>
                  {currentStation.listeners.toLocaleString()} listeners
                </p>

                {/* Play/Pause */}
                <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-lg)' }}>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: 'none',
                      background: currentStation.color,
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 16px ${currentStation.color}55`,
                      transition: 'all 0.2s',
                    }}
                  >
                    {isPlaying ? '\u23F8' : '\u25B6'}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        borderRadius: '9999px',
                        background: 'var(--bg-inset)',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          borderRadius: '9999px',
                          background: currentStation.color,
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{'\u{1F50A}'}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={e => setVolume(Number(e.target.value))}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '9999px',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      background: `linear-gradient(to right, ${currentStation.color} ${volume}%, var(--bg-inset) ${volume}%)`,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'right' }}>
                    {volume}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Station Grid */}
          <section style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: "'Newsreader', Georgia, serif",
                marginBottom: 'var(--space-lg)',
              }}
            >
              All Stations
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)' }}>
              {STATIONS.map(station => (
                <div
                  key={station.name}
                  className="hover-lift"
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: '16px',
                    padding: 'var(--space-lg)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--card-shadow)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => {
                    setCurrentStation(station)
                    setIsPlaying(true)
                  }}
                >
                  <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-md)' }}>
                    {/* Station Logo */}
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: `${station.color}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: station.color }}>
                        {station.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {station.name}
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {station.genre}
                      </p>
                    </div>
                    {station.live && (
                      <div className="flex items-center gap-1">
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            animation: 'livePulse 1.5s ease-in-out infinite',
                          }}
                        />
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>
                          Live
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {station.listeners.toLocaleString()} listeners
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => e.stopPropagation()}
                        style={{
                          padding: '5px 14px',
                          borderRadius: '9999px',
                          border: `1px solid ${station.color}`,
                          background: 'transparent',
                          color: station.color,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        Follow
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setCurrentStation(station)
                          setIsPlaying(true)
                        }}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: 'none',
                          background: station.color,
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        {'\u25B6'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Popular Podcasts */}
          <section style={{ marginBottom: 'var(--space-2xl)' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: "'Newsreader', Georgia, serif",
                marginBottom: 'var(--space-lg)',
              }}
            >
              Popular Podcasts
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)' }}>
              {PODCASTS.map(podcast => (
                <div
                  key={podcast.title}
                  className="hover-lift"
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--card-shadow)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      height: '140px',
                      background: `linear-gradient(135deg, ${podcast.coverColor} 0%, ${podcast.coverColor}88 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: '2.5rem' }}>{'\u{1F3A7}'}</span>
                  </div>
                  <div style={{ padding: 'var(--space-md)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {podcast.title}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                      {podcast.author}
                    </p>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {podcast.episodes} episodes
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {podcast.duration} avg
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recently Played */}
          <section>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: "'Newsreader', Georgia, serif",
                marginBottom: 'var(--space-lg)',
              }}
            >
              Recently Played
            </h2>
            <div
              style={{
                background: 'var(--bg-surface)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--card-shadow)',
                overflow: 'hidden',
              }}
            >
              {RECENTLY_PLAYED.map((item, i) => (
                <div
                  key={i}
                  className="hover-lift"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md) var(--space-lg)',
                    borderBottom: i < RECENTLY_PLAYED.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'var(--bg-inset)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{'\u{1F3B5}'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {item.station}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {item.time}
                  </span>
                  <button
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {'\u25B6'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
