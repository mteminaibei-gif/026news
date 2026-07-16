'use client'

import { useState } from 'react'


interface PlaylistItem {
  id: string
  title: string
  author: string
  duration: string
}

const PLAYLIST: PlaylistItem[] = [
  { id: '1', title: 'The Future of East African Trade', author: 'Amina Hassan', duration: '32:15' },
  { id: '2', title: 'Digital Democracy in Kenya', author: 'James Odhiambo', duration: '28:40' },
  { id: '3', title: 'Climate Resilience: A Farmer\'s Story', author: 'Grace Wanjiku', duration: '41:02' },
  { id: '4', title: 'Youth Voices in Governance', author: 'Peter Mwangi', duration: '25:18' },
  { id: '5', title: 'Inside the Tech Start-up Boom', author: 'Sarah Kimani', duration: '36:55' },
]

export default function AudioPlayerPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(35)
  const [transcriptExpanded, setTranscriptExpanded] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [shuffle, setShuffle] = useState(false)

  const currentTime = '11:25'
  const totalTime = '32:15'

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <main className="flex-1" style={{ paddingInline: 'var(--space-lg)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBlock: 'var(--space-xl)' }}>
          {/* Top links */}
          <div className="flex gap-6" style={{ marginBottom: 'var(--space-xl)' }}>
            {['Browse', 'My Playlists', 'Liked'].map(link => (
              <button
                key={link}
                className="nav-link font-semibold"
                style={{
                  fontSize: '0.88rem',
                  color: link === 'Browse' ? 'var(--primary)' : 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Player card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            {/* Album artwork */}
            <div
              className="flex items-center justify-center gap-4"
              style={{
                height: '240px',
                background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))',
                position: 'relative',
              }}
            >
              <button
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '2px solid var(--bg-elevated)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {'\u23EE'}
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center justify-center"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'var(--bg-elevated)',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  boxShadow: 'var(--card-hover-shadow)',
                  transition: 'all 0.2s',
                }}
              >
                {isPlaying ? '\u23F8' : '\u25B6'}
              </button>
              <button
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '2px solid var(--bg-elevated)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {'\u23ED'}
              </button>
            </div>

            <div style={{ padding: 'var(--space-xl)' }}>
              {/* Title + Author */}
              <h2
                className="font-serif"
                style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}
              >
                The Future of East African Trade
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                Amina Hassan
              </p>

              {/* Progress bar */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '9999px',
                    background: 'var(--bg-inset)',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      borderRadius: '9999px',
                      background: 'var(--accent)',
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
                <div className="flex justify-between" style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentTime}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{totalTime}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-5" style={{ marginBottom: 'var(--space-xl)' }}>
                <button
                  onClick={() => setShuffle(!shuffle)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: 'none',
                    background: shuffle ? 'var(--primary-light)' : 'transparent',
                    color: shuffle ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {'\uD83D\uDD00'}
                </button>
                <button
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {'\u23EE'}
                </button>
                <button
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {'\u23EA'}
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center justify-center"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'var(--bg-elevated)',
                    cursor: 'pointer',
                    fontSize: '1.3rem',
                    boxShadow: '0 4px 16px oklch(45% 0.12 175 / 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isPlaying ? '\u23F8' : '\u25B6'}
                </button>
                <button
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {'\u23E9'}
                </button>
                <button
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {'\u23ED'}
                </button>
                <button
                  onClick={() => setRepeat(!repeat)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: 'none',
                    background: repeat ? 'var(--primary-light)' : 'transparent',
                    color: repeat ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {'\u21BB'}
                </button>
              </div>

              {/* Transcript section */}
              <div
                className="rounded-xl"
                style={{
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-subtle)',
                  padding: 'var(--space-md)',
                }}
              >
                <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-sm)' }}>
                  <span
                    className="font-semibold"
                    style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}
                  >
                    Transcript
                  </span>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                    }}
                  >
                    AI Generated
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    display: transcriptExpanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: transcriptExpanded ? 'unset' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: transcriptExpanded ? 'visible' : 'hidden',
                  }}
                >
                  In this episode, we explore the rapidly evolving landscape of trade across East Africa. From the
                  implementation of the African Continental Free Trade Area to the digital transformation of border
                  crossings, the region is witnessing unprecedented economic integration. Our guest, a leading trade
                  economist, breaks down the implications for small and medium enterprises and what the future holds
                  for cross-border commerce in the Horn of Africa.
                </p>
                <button
                  onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                  className="font-semibold"
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: 'var(--space-xs)',
                  }}
                >
                  {transcriptExpanded ? 'Show less' : 'Read more'}
                </button>
              </div>
            </div>
          </div>

          {/* Playlist section */}
          <div style={{ marginTop: 'var(--space-2xl)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
              <h3 className="font-semibold" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Playlist
              </h3>
              <button
                className="font-semibold"
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                View All
              </button>
            </div>

            <div className="flex flex-col">
              {PLAYLIST.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4"
                  style={{
                    padding: '0.875rem var(--space-md)',
                    borderBottom: i < PLAYLIST.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    background: 'var(--bg-surface)',
                    borderRadius: i === 0 ? '12px 12px 0 0' : i === PLAYLIST.length - 1 ? '0 0 12px 12px' : '0',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, var(--primary-light), var(--accent-light))',
                      flexShrink: 0,
                    }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}
                    >
                      {item.title}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {item.author}
                    </p>
                  </div>

                  {/* Duration */}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {item.duration}
                  </span>

                  {/* Play button */}
                  <button
                    className="flex items-center justify-center"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >
                    {'\u25B6'}
                  </button>

                  {/* More options */}
                  <button
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {'\u22EF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
