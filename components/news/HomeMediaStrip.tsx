'use client'

import Link from 'next/link'
import { Radio, Tv, Play, Pause, Activity, Globe, Signal, Volume2, Tv2, RadioTower, Monitor, Smartphone, Music, MessageSquare } from 'lucide-react'
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
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: active ? `${color}1a` : 'var(--bg-surface)',
        border: `2px solid ${active ? color : 'var(--border-subtle)'}`,
        minWidth: 0,
        boxShadow: active ? `0 4px 14px ${color}33` : 'none',
      }}
    >
      <span style={{ color, display: 'flex', flexShrink: 0, background: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: 6 }}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</span>
        <span className="flex items-center gap-1.5" style={{ color: live === false ? 'var(--text-tertiary)' : 'var(--success)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: live === false ? 'var(--text-tertiary)' : '#22c55e', animation: live === false ? 'none' : 'pulse 1.5s ease-in-out infinite', boxShadow: live === true ? '0 0 6px #22c55e99' : 'none' }} />
          {live === false ? 'Offline' : 'Live'}
        </span>
      </span>
      {active && (
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
      )}
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

  // Determine which icon to show based on station type
  const getStationIcon = (station: any, type: 'radio' | 'tv') => {
    const iconMap = type === 'radio' ? {
      'kenyafm': Radio,
      'citizen': Activity,
      'music': Volume2,
      'classical': RadioTower,
      'dance': Music,
      'talk': MessageSquare,
    } : {
      'citizen': Tv,
      'ntv': Tv2,
      'k24': Monitor,
      'switch': Activity,
      'tv47': Tv2,
      'nation': Globe,
      'kiss': Tv2,
    }
    return iconMap[station.id as keyof typeof iconMap] || (type === 'radio' ? Radio : Tv)
  }

  return (
    <section style={{ marginBottom: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="feed-heading" style={{ marginBottom: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Live Media</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
            <Signal size={12} />
            <span>{radioStatus('kenyafm') === true ? 4 : 0}/{radioStatus('citizen') === true ? 4 : 0}/{radioStatus('ntv') === true ? 4 : 0}/{radioStatus('k24') === true ? 4 : 0} Live</span>
          </div>
          <Link href="/radio" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', padding: '6px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Radio size={14} /> Radio
          </Link>
          <Link href="/tv" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', padding: '6px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tv size={14} /> TV
          </Link>
        </div>
      </div>

      <div className="relative">
        {/* Slider Track */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10 rounded-l-2xl" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10 rounded-r-2xl" />
        
        <div className="flex gap-5 overflow-x-auto pb-6 px-4 no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
          {/* Radio Section */}
          <div className="flex-shrink-0 w-[280px]">
            <div className="card-glass rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-inset))', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2.5 rounded-xl bg-[rgba(239,68,68,0.12)]" style={{ color: '#ef4444' }}>
                  <Radio size={18} strokeWidth={2.5} />
                </div>
                <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Listen Live</span>
                <div className="ml-auto px-2.5 py-1 rounded-full bg-[rgba(34,197,94,0.12)]" style={{ color: '#22c55e', fontSize: '0.65rem', fontWeight: 600 }}>
                  Audio
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {radioPicks.map(s => {
                  const IconComponent = getStationIcon(s, 'radio')
                  return (
                    <StationPill
                      key={s.id}
                      name={s.name}
                      color={s.color}
                      live={radioStatus(s.id)}
                      active={radio.currentStation?.id === s.id && radio.isPlaying}
                      icon={<IconComponent size={16} strokeWidth={2.5} />}
                      onClick={() => radio.playStation(s)}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* TV Section */}
          <div className="flex-shrink-0 w-[280px]">
            <div className="card-glass rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-inset))', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2.5 rounded-xl bg-[rgba(59,130,246,0.12)]" style={{ color: '#3b82f6' }}>
                  <Tv size={18} strokeWidth={2.5} />
                </div>
                <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Watch Live</span>
                <div className="ml-auto px-2.5 py-1 rounded-full bg-[rgba(99,102,241,0.12)]" style={{ color: '#6366f1', fontSize: '0.65rem', fontWeight: 600 }}>
                  Video
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {tvPicks.map(s => {
                  const IconComponent = getStationIcon(s, 'tv')
                  return (
                    <StationPill
                      key={s.id}
                      name={s.name}
                      color={s.color}
                      live={tvStatus(s.id)}
                      active={tv.currentStation?.id === s.id && tv.isPlaying}
                      icon={<IconComponent size={16} strokeWidth={2.5} />}
                      onClick={() => tv.playStation(s)}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="flex-shrink-0 flex gap-4">
            <Link href="/radio" className="flex-shrink-0 w-[240px] card-glass rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group" style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-inset))', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3.5 rounded-xl bg-[rgba(34,197,94,0.12)]" style={{ color: '#22c55e' }}>
                  <RadioTower size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Explore Radio</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{KENYA_STATIONS.length}+ stations</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-200" style={{ color: '#22c55e' }}>
                Browse all stations
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
              </div>
            </Link>

            <Link href="/tv" className="flex-shrink-0 w-[240px] card-glass rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group" style={{ background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-inset))', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3.5 rounded-xl bg-[rgba(59,130,246,0.12)]" style={{ color: '#3b82f6' }}>
                  <Monitor size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Explore TV</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{KENYAN_TV_STATIONS.length}+ stations</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-200" style={{ color: '#3b82f6' }}>
                Browse all stations
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
              </div>
            </Link>
          </div>
        </div>
        
        <style jsx>{`
          .no-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
          }
        `}</style>
      </div>
    </section>
  )
}
