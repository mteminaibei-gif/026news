'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

interface Headline {
  article_id: number
  title: string
  slug: string
  created_at: string
  category: { name: string } | null
}

interface Props {
  /** Server-fetched initial headlines to render before SSE connects */
  initialHeadlines?: Headline[]
}

export function BreakingNewsTicker({ initialHeadlines = [] }: Props) {
  const [headlines, setHeadlines]     = useState<Headline[]>(initialHeadlines)
  const [isLive, setIsLive]           = useState(false)
  const [newFlash, setNewFlash]       = useState(false)
  const esRef                         = useRef<EventSource | null>(null)
  const reconnectTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCount                    = useRef(0)

  const connect = useCallback(() => {
    // Clean up any existing connection
    esRef.current?.close()
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)

    const es = new EventSource('/api/sse/breaking-news')
    esRef.current = es

    es.addEventListener('init', (e: MessageEvent) => {
      try {
        const { articles } = JSON.parse(e.data) as { articles: Headline[] }
        setHeadlines(articles)
        setIsLive(true)
        retryCount.current = 0
      } catch { /* ignore parse error */ }
    })

    es.addEventListener('breaking', (e: MessageEvent) => {
      try {
        const { articles } = JSON.parse(e.data) as { articles: Headline[] }
        if (articles.length === 0) return
        setHeadlines(prev => {
          const ids = new Set(prev.map(h => h.article_id))
          const fresh = articles.filter(a => !ids.has(a.article_id))
          if (fresh.length === 0) return prev
          return [...fresh, ...prev].slice(0, 20)
        })
        // Flash "NEW" indicator
        setNewFlash(true)
        setTimeout(() => setNewFlash(false), 4000)
      } catch { /* ignore */ }
    })

    es.onerror = () => {
      setIsLive(false)
      es.close()
      // Exponential back-off: 2 s, 4 s, 8 s … max 30 s
      const delay = Math.min(2000 * 2 ** retryCount.current, 30_000)
      retryCount.current++
      reconnectTimer.current = setTimeout(connect, delay)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [connect])

  if (headlines.length === 0) return null

  const KENYA_CATS = ['Kenya', 'Africa', 'Politics', 'Business']

  return (
    <div className="bg-[#1a5c2a] text-white py-2 overflow-hidden border-b-2 border-[#f5c518]/20 relative">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">

        {/* Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`
            bg-[#c8102e] text-white px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider
            ${newFlash ? 'animate-pulse-glow' : ''}
          `}>
            {newFlash ? '🆕 NEW' : '🇰🇪 Breaking'}
          </span>

          {/* Live indicator */}
          <span className="flex items-center gap-1 shrink-0">
            <span className={`relative flex h-2 w-2 ${isLive ? '' : 'opacity-40'}`}>
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4caf28] opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-[#4caf28]' : 'bg-gray-400'}`} />
            </span>
          </span>
        </div>

        {/* Scrolling headlines */}
        <div className="overflow-hidden flex-1 mask-fade-right">
          <div
            className="flex gap-8 whitespace-nowrap"
            style={{ animation: `ticker ${Math.max(headlines.length * 8, 30)}s linear infinite` }}
          >
            {/* Double the list for seamless loop */}
            {[...headlines, ...headlines].map((h, i) => {
              const isKenya = KENYA_CATS.includes(h.category?.name ?? '')
              return (
                <Link
                  key={`${h.article_id}-${i}`}
                  href={`/article/${h.slug}`}
                  className="text-sm text-white/80 hover:text-white transition-colors shrink-0 group"
                >
                  <span className={`mr-1.5 ${isKenya ? 'text-[#f5c518]' : 'text-[#4caf28]/60'}`}>
                    {isKenya ? '🇰🇪' : '●'}
                  </span>
                  <span className="group-hover:underline underline-offset-2">
                    {h.title}
                  </span>
                  {h.category && (
                    <span className="ml-1.5 text-white/30 text-xs">
                      [{h.category.name}]
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Fade mask on right */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#1a5c2a] to-transparent pointer-events-none" />
    </div>
  )
}
