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

function isAdSenseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_ADSENSE_ID &&
    process.env.NEXT_PUBLIC_ADSENSE_ID !== 'ca-pub-XXXXXXXXXXXXXXXX'
  )
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
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID ?? 'ca-pub-XXXXXXXXXXXXXXXX'}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  )
}

// Predefined ad placements — only render when AdSense is configured
export function BannerAd() {
  if (!isAdSenseConfigured()) return null
  return (
    <div style={{ margin: '16px auto', maxWidth: 728 }}>
      <AdSense slot="0000000000" format="horizontal" style={{ width: '100%', height: 90 }} />
    </div>
  )
}

export function InArticleAd() {
  if (!isAdSenseConfigured()) return null
  return (
    <div style={{ margin: '24px auto', maxWidth: 728 }}>
      <AdSense slot="0000000001" format="auto" style={{ width: '100%', minHeight: 250 }} />
    </div>
  )
}

export function SidebarAd() {
  if (!isAdSenseConfigured()) return null
  return (
    <div style={{ margin: '16px 0' }}>
      <AdSense slot="0000000002" format="rectangle" style={{ width: '100%', height: 250 }} />
    </div>
  )
}
