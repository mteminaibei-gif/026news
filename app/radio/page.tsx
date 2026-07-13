'use client'

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useRadio } from '@/components/radio/RadioProvider'
import { KENYA_STATIONS, GLOBAL_STATIONS } from '@/lib/radio/stations'
import type { RadioStation } from '@/lib/radio/stations'

const KENYA_PODCASTS = [
  { title: 'Kenya Talks', author: 'NRG Radio', episodes: 186, duration: '45 min', coverColor: '#e11d48' },
  { title: 'The Trend Factory', author: 'Capital FM', episodes: 98, duration: '38 min', coverColor: '#0f766e' },
  { title: 'Stories of Africa', author: 'Radio Citizen', episodes: 142, duration: '52 min', coverColor: '#16a34a' },
  { title: 'Tech Pulse Africa', author: 'Kiss 100', episodes: 89, duration: '35 min', coverColor: '#db2777' },
  { title: 'On the Pitch KE', author: 'Radio Jambo', episodes: 210, duration: '40 min', coverColor: '#0891b2' },
  { title: 'Biz Breakfast', author: 'Classic 105', episodes: 178, duration: '32 min', coverColor: '#ea580c' },
]

const GLOBAL_PODCASTS = [
  { title: 'The Daily', author: 'The New York Times', episodes: 1240, duration: '25 min', coverColor: '#2563eb' },
  { title: 'BBC Global News', author: 'BBC World Service', episodes: 980, duration: '30 min', coverColor: '#7c3aed' },
  { title: 'How I Built This', author: 'NPR', episodes: 410, duration: '50 min', coverColor: '#ca8a04' },
  { title: 'TED Talks Daily', author: 'TED', episodes: 1560, duration: '15 min', coverColor: '#dc2626' },
  { title: 'The Economist Asks', author: 'The Economist', episodes: 320, duration: '28 min', coverColor: '#16a34a' },
  { title: 'Waveform', author: 'MrMobile & dbrand', episodes: 265, duration: '60 min', coverColor: '#0891b2' },
]

const RECENTLY_PLAYED = [
  { title: 'Kenya Talk: Episode 156', station: '026 Sonic', time: '2h ago' },
  { title: 'Tech Pulse: AI in Africa', station: '026 Indie', time: '5h ago' },
  { title: 'Sports Zone: Premier League Review', station: '026 Beat', time: '1d ago' },
  { title: 'Morning Vibes: Tuesday Edition', station: '026 Soul', time: '2d ago' },
]

export default function RadioPage() {
  const { currentStation, isPlaying, volume, status, playStation, toggle, setVolume } = useRadio()
  const nowPlaying = currentStation ?? KENYA_STATIONS[0]
  const isThisPlaying = currentStation?.id === nowPlaying.id && isPlaying

  const renderStations = (stations: RadioStation[]) =>
    stations.map(station => {
      const active = currentStation?.id === station.id
      return (
        <div
          key={station.id}
          className="hover-lift"
          style={{
            background: active ? 'var(--primary-light)' : 'var(--bg-surface)',
            borderRadius: '16px',
            padding: 'var(--space-lg)',
            border: `1px solid ${active ? station.color : 'var(--border-subtle)'}`,
            boxShadow: 'var(--card-shadow)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => playStation(station)}
        >
          <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-md)' }}>
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
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {station.listeners.toLocaleString()} listeners
            </span>
            <button
              onClick={e => { e.stopPropagation(); playStation(station) }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: active ? station.color : 'var(--bg-inset)',
                color: active ? '#fff' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              aria-label={`Play ${station.name}`}
            >
              {active && isPlaying ? '⏸' : '▶'}
            </button>
          </div>
        </div>
      )
    })

  const renderPodcasts = (podcasts: typeof KENYA_PODCASTS) =>
    podcasts.map(podcast => (
      <div
        key={podcast.title}
        className="hover-lift"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-shadow)',
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
          <span style={{ fontSize: '2.5rem' }}>🎧</span>
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
    ))

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
              <span style={{ fontSize: '2rem' }}>📻</span>
              <h1
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Radio & Podcasts
              </h1>
            </div>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', maxWidth: '600px' }}>
              Listen to 026Newsblog live radio — streaming seamlessly across the site.
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
            <div className="radio-now-playing">
              {/* Album Art */}
              <div className="radio-now-playing-art" style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '240px',
                    height: '240px',
                    maxWidth: '100%',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${nowPlaying.color} 0%, ${nowPlaying.color}88 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 32px ${nowPlaying.color}44`,
                  }}
                >
                  <span style={{ fontSize: '4rem' }}>📻</span>
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
                        background: nowPlaying.color,
                        animation: isThisPlaying
                          ? `${['eqBar1', 'eqBar2', 'eqBar3', 'eqBar4', 'eqBar5', 'eqBar3', 'eqBar2', 'eqBar1', 'eqBar4'][i]} ${0.4 + i * 0.1}s ease-in-out infinite`
                          : 'none',
                        height: isThisPlaying ? undefined : '4px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Player Info */}
              <div>
                <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 'var(--space-sm)' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {nowPlaying.name}
                  </h2>
                  <span
                    className="flex items-center gap-1"
                    style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      background: isThisPlaying ? '#ef4444' : 'var(--bg-inset)',
                      color: isThisPlaying ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {isThisPlaying && (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          animation: 'livePulse 1.5s ease-in-out infinite',
                        }}
                      />
                    )}
                    {isThisPlaying ? 'LIVE' : 'READY'}
                  </span>
                  {status === 'loading' && currentStation?.id === nowPlaying.id && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Connecting…</span>
                  )}
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                  {nowPlaying.genre}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>
                  {nowPlaying.listeners.toLocaleString()} listeners
                </p>

                {/* Play/Pause */}
                <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-lg)' }}>
                  <button
                    onClick={() => (currentStation?.id === nowPlaying.id ? toggle() : playStation(nowPlaying))}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      border: 'none',
                      background: nowPlaying.color,
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 16px ${nowPlaying.color}55`,
                      transition: 'all 0.2s',
                    }}
                    aria-label={isThisPlaying ? 'Pause' : 'Play'}
                  >
                    {isThisPlaying ? '⏸' : '▶'}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        borderRadius: '9999px',
                        background: 'var(--bg-inset)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: isThisPlaying ? '100%' : '0%',
                          height: '100%',
                          borderRadius: '9999px',
                          background: nowPlaying.color,
                          transition: 'width 0.4s linear',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      {isThisPlaying ? 'Now streaming live' : 'Press play to start streaming'}
                    </p>
                  </div>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🔊</span>
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
                      accentColor: nowPlaying.color,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                    aria-label="Volume"
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'right' }}>
                    {volume}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kenyan Radio (prioritised) */}
          <section style={{ marginBottom: 'var(--space-2xl)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 'var(--space-lg)' }}>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Kenyan Radio
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Live from Nairobi &amp; across Kenya</span>
            </div>
            <div className="radio-stations-grid">{renderStations(KENYA_STATIONS)}</div>
          </section>

          {/* Global Radio */}
          <section style={{ marginBottom: 'var(--space-2xl)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 'var(--space-lg)' }}>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Global Radio
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Worldwide streams</span>
            </div>
            <div className="radio-stations-grid">{renderStations(GLOBAL_STATIONS)}</div>
          </section>

          {/* Kenya Podcasts */}
          <section style={{ marginBottom: 'var(--space-2xl)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 'var(--space-lg)' }}>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Kenya Podcasts
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Made in Kenya</span>
            </div>
            <div className="radio-podcasts-grid">{renderPodcasts(KENYA_PODCASTS)}</div>
          </section>

          {/* Global Podcasts */}
          <section style={{ marginBottom: 'var(--space-2xl)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 'var(--space-lg)' }}>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Global Podcasts
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>From around the world</span>
            </div>
            <div className="radio-podcasts-grid">{renderPodcasts(GLOBAL_PODCASTS)}</div>
          </section>

          {/* Recently Played */}
          <section>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
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
                    <span style={{ fontSize: '1rem' }}>📻</span>
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
