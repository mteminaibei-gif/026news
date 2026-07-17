'use client'

import Link from 'next/link'
import { Radio, Tv, Play, Pause } from 'lucide-react'
import { KENYAN_TV_STATIONS, ALL_TV_STATIONS } from '@/lib/tv/stations'
import { RADIO_STATIONS, KENYA_STATIONS } from '@/lib/radio/stations'
import { useMediaHealth } from '@/lib/hooks/useMediaHealth'
import { useRadio } from '@/components/radio/RadioProvider'
import { useTVGlobal } from '@/components/tv/TVGlobalProvider'

function StationPill({
  name, color, live, onClick, active, icon,
}: {
  name: string
  color: string
  live: boolean | undefined
  onClick?: () => void
  active?: boolean
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: active ? `${color}1a` : 'var(--bg-surface)',
        border: `1px solid ${active ? color : 'var(--border-subtle)'}`,
        minWidth: 0,
      }}
    >
      <span style={{ color, display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</span>
        <span className="flex items-center gap-1" style={{ color: live === false ? 'var(--text-tertiary)' : 'var(--success)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: live === false ? 'var(--text-tertiary)' : '#22c55e', animation: live === false ? 'none' : 'pulse 1.5s ease-in-out infinite' }} />
          {live === false ? 'Offline' : 'Live'}
        </span>
      </span>
    </button>
  )
}

export function HomeMediaStrip() {
  const { radioStatus } = useMediaHealth()
  const { tvStatus } = useMediaHealth()
  const radio = useRadio()
  const tv = useTVGlobal()

  const radioPicks = KENYA_STATIONS.slice(0, 4)
  const tvPicks = KENYAN_TV_STATIONS.slice(0, 4)

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="feed-heading" style={{ marginBottom: 0 }}>Live Media</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/radio" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Radio</Link>
          <Link href="/tv" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>TV</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Radio */}
        <div className="card-glass p-4" style={{ borderRadius: 16 }}>
          <div className="flex items-center gap-2 mb-3">
            <Radio size={16} style={{ color: '#ef4444' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Listen Live</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {radioPicks.map(s => (
              <StationPill
                key={s.id}
                name={s.name}
                color={s.color}
                live={radioStatus(s.id)}
                active={radio.currentStation?.id === s.id && radio.isPlaying}
                icon={<Radio size={14} />}
                onClick={() => radio.playStation(s)}
              />
            ))}
          </div>
        </div>

        {/* TV */}
        <div className="card-glass p-4" style={{ borderRadius: 16 }}>
          <div className="flex items-center gap-2 mb-3">
            <Tv size={16} style={{ color: '#3b82f6' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Watch Live</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tvPicks.map(s => (
              <StationPill
                key={s.id}
                name={s.name}
                color={s.color}
                live={tvStatus(s.id)}
                active={tv.currentStation?.id === s.id && tv.isPlaying}
                icon={<Tv size={14} />}
                onClick={() => tv.playStation(s)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
