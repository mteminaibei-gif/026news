'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { TVGlobalProvider, useTVGlobal } from '@/components/tv/TVGlobalProvider'
import { KENYAN_TV_STATIONS, AFRICAN_TV_STATIONS, GLOBAL_TV_STATIONS, ALL_TV_STATIONS, type TVStation } from '@/lib/tv/stations'
import { createClient } from '@/lib/supabase/client'
import { formatNumber, stripHtml } from '@/lib/utils'
import { Tv, Eye, Clock, Play, Pause, Globe, RefreshCw, Shuffle } from 'lucide-react'
import { initHlsPlayback } from '@/lib/tv/hls-player'

type TVArticle = {
  article_id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  views: number
  created_at: string
  source_name: string | null
  author: { name: string; profile_image: string | null } | null
  category: { name: string } | null
}

function TVPageContent() {
  const { currentStation, isPlaying, playStation, stop, status, error } = useTVGlobal()
  const [articles, setArticles] = useState<TVArticle[]>([])
  const [activeTab, setActiveTab] = useState<'live' | 'kenya' | 'africa' | 'global'>('live')

  useEffect(() => {
    const fetchArticles = async () => {
      const supabase = createClient()
      const TV_PATTERNS = ['citizen', 'ntv', 'kbc', 'k24', 'nation', 'switch', 'tv47', 'lulu', 'ramogi', 'royal media', 'news central', 'africanews', 'tv360', 'channel one', 'ghana']
      const { data } = await supabase
        .from('articles')
        .select('article_id, title, slug, excerpt, content, featured_image, views, created_at, source_name, author:users(name, profile_image), category:categories(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(100)
      const all = (data ?? []) as unknown as TVArticle[]
      setArticles(all.filter(a => {
        const src = (a.source_name ?? '').toLowerCase()
        return TV_PATTERNS.some(p => src.includes(p))
      }))
    }
    fetchArticles()
  }, [])

  const renderStationCard = (station: TVStation) => {
    const active = currentStation?.id === station.id && isPlaying
    return (
      <div
        key={station.id}
        className="hover-lift cursor-pointer transition-all duration-200"
        style={{
          background: active ? `${station.color}15` : 'var(--bg-surface)',
          borderRadius: 16,
          border: `2px solid ${active ? station.color : 'var(--border-subtle)'}`,
          overflow: 'hidden',
          boxShadow: active ? `0 4px 20px ${station.color}33` : 'var(--card-shadow)',
        }}
        onClick={() => playStation(station)}
      >
        {/* Live preview */}
        <div
          className="relative flex items-center justify-center"
          style={{
            height: 140,
            background: `linear-gradient(135deg, ${station.color} 0%, ${station.color}88 100%)`,
          }}
        >
          <span style={{ fontSize: '3rem' }}>{station.logo}</span>
          {active && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex items-end gap-1 h-10">
                {[1,2,3,4,5,4,3,2,1].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-white"
                    style={{
                      animation: isPlaying ? `eqBar${(i % 5) + 1} ${0.4 + i * 0.1}s ease-in-out infinite` : 'none',
                      height: isPlaying ? undefined : '4px',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-[9px] font-bold uppercase">LIVE</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{station.name}</h3>
            <button
              onClick={(e) => { e.stopPropagation(); playStation(station) }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-transform active:scale-90"
              style={{ background: station.color }}
              aria-label={active ? `Pause ${station.name}` : `Watch ${station.name}`}
            >
              {active ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{station.genre}</p>
        </div>
      </div>
    )
  }

  const TV_SOURCE_PATTERNS = ['citizen', 'ntv', 'kbc', 'k24', 'nation', 'switch', 'tv47', 'lulu', 'ramogi', 'royal media']

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <style>{`
        @keyframes eqBar1 { 0%, 100% { height: 4px; } 50% { height: 18px; } }
        @keyframes eqBar2 { 0%, 100% { height: 8px; } 50% { height: 14px; } }
        @keyframes eqBar3 { 0%, 100% { height: 6px; } 50% { height: 22px; } }
        @keyframes eqBar4 { 0%, 100% { height: 10px; } 50% { height: 16px; } }
        @keyframes eqBar5 { 0%, 100% { height: 5px; } 50% { height: 20px; } }
      `}</style>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '32px 0 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingInline: 24 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <Tv size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Kenyan TV — Live
              </h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Watch live streams directly — no redirects
              </p>
            </div>
          </div>
        </div>
      </section>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 64px', width: '100%' }}>
        {/* Inline Player — shows when a station is selected */}
        {currentStation && (
          <div
            className="rounded-2xl overflow-hidden mb-8"
            style={{ border: `2px solid ${currentStation.color}`, boxShadow: `0 8px 32px ${currentStation.color}22` }}
          >
            {/* Player header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ background: currentStation.color }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{currentStation.logo}</span>
                <div>
                  <span className="text-white font-bold text-sm">{currentStation.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-white/80 text-[10px] font-bold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={stop}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm transition-colors"
                aria-label="Close player"
              >
                ✕
              </button>
            </div>
            {/* Video embed - inline player */}
            <div className="relative bg-black" style={{ paddingBottom: '56.25%', minHeight: 200 }}>
              {currentStation.embedType === 'hls' ? (
                <video
                  className="absolute inset-0 w-full h-full object-contain"
                  playsInline
                  muted
                  autoPlay
                  controls
                  ref={(el) => {
                    if (!el) return
                    initHlsPlayback(el, currentStation.streamUrl, {
                      onError: (msg) => console.error('HLS error:', msg),
                    })
                  }}
                />
              ) : (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={currentStation.streamUrl}
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  frameBorder="0"
                  title={`Live stream: ${currentStation.name}`}
                />
              )}
            </div>
            {/* Station info footer */}
            <div className="px-4 py-2" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{currentStation.name} — {currentStation.genre}</p>
              {status === 'loading' && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <Clock size={12} className="animate-spin" />
                    Connecting...
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-red-400">{error}</span>
                  <button onClick={() => playStation(currentStation)}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
                    style={{ background: currentStation.color, color: '#fff' }}>
                    <RefreshCw size={12} /> Retry
                  </button>
                  <button onClick={() => {
                    const others = ALL_TV_STATIONS.filter(s => s.id !== currentStation.id)
                    if (others.length) playStation(others[Math.floor(Math.random() * others.length)])
                  }}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                    <Shuffle size={12} /> Try Another
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'live' as const, label: 'All Stations', icon: <Tv size={14} /> },
            { id: 'kenya' as const, label: 'Kenya', icon: '🇰🇪' },
            { id: 'africa' as const, label: 'Africa', icon: '🌍' },
            { id: 'global' as const, label: 'World', icon: <Globe size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--primary)' : 'var(--bg-surface)',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${activeTab === tab.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Station Grid */}
        <section className="mb-10">
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {activeTab === 'kenya' ? 'Kenyan TV' : activeTab === 'africa' ? 'African TV' : activeTab === 'global' ? 'World TV' : 'All TV Stations'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {(activeTab === 'kenya' ? KENYAN_TV_STATIONS : activeTab === 'africa' ? AFRICAN_TV_STATIONS : activeTab === 'global' ? GLOBAL_TV_STATIONS : [...KENYAN_TV_STATIONS, ...AFRICAN_TV_STATIONS, ...GLOBAL_TV_STATIONS]).map(renderStationCard)}
          </div>
        </section>

        {/* Latest TV News */}
        {articles.length > 0 && (
          <section>
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Latest TV News
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {articles.slice(0, 9).map(article => {
                const allStations = [...KENYAN_TV_STATIONS, ...AFRICAN_TV_STATIONS]
                const station = allStations.find(s => {
                  const src = (article.source_name ?? '').toLowerCase()
                  return src.includes(s.id) || src.includes(s.name.toLowerCase())
                })
                return (
                  <Link
                    key={article.article_id}
                    href={`/article/${article.slug}`}
                    className="flex gap-3 p-3 rounded-xl transition-all hover:shadow-md"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', textDecoration: 'none', color: 'inherit' }}
                  >
                    {article.featured_image ? (
                      <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={article.featured_image} alt="" fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div className="w-20 h-16 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: station ? `${station.color}15` : 'var(--bg-muted)' }}>
                        <Tv size={16} style={{ color: station?.color ?? 'var(--text-tertiary)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {station && (
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: station.color }}>
                          {station.name}
                        </span>
                      )}
                      <h3 className="text-xs font-semibold leading-tight mt-0.5 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="flex items-center gap-0.5"><Eye size={9} /> {formatNumber(article.views ?? 0)}</span>
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {articles.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <Tv size={40} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No TV articles yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Articles from Kenyan TV stations will appear here.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default function TVPage() {
  return (
    <TVPageContent />
  )
}
