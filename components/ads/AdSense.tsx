'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface AdProps {
  slot: string
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle'
  responsive?: boolean
  style?: React.CSSProperties
  className?: string
}

export function AdSense({ slot, format = 'auto', responsive = true, style, className }: AdProps) {
  const adRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch { /* AdSense not loaded yet */ }
  }, [])

  return (
    <div className={`adsense-container ${className ?? ''}`} style={{ textAlign: 'center', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}

// Predefined ad placements
export function BannerAd() {
  return (
    <div className="my-6" style={{ minHeight: 90 }}>
      <AdSense slot="0000000000" format="horizontal" style={{ width: '100%', height: 90 }} />
    </div>
  )
}

export function InArticleAd() {
  return (
    <div className="my-8" style={{ minHeight: 250 }}>
      <AdSense slot="0000000001" format="auto" style={{ width: '100%', minHeight: 250 }} />
    </div>
  )
}

export function SidebarAd() {
  return (
    <div className="sticky top-24" style={{ minHeight: 600 }}>
      <AdSense slot="0000000002" format="vertical" style={{ width: '100%', minHeight: 600 }} />
    </div>
  )
}
