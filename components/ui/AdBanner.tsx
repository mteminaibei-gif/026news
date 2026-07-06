'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
  slot?: string
  format?: 'auto' | 'rectangle' | 'leaderboard' | 'banner'
  className?: string
  label?: string
}

/**
 * Google AdSense banner with graceful fallback.
 * Set NEXT_PUBLIC_ADSENSE_ID in your environment.
 * Displays a placeholder in development or when AdSense is not configured.
 */
export function AdBanner({ slot = '1234567890', format = 'auto', className = '', label = 'Advertisement' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null)
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID

  useEffect(() => {
    if (!publisherId) return
    try {
      // @ts-expect-error adsbygoogle is injected by AdSense script
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense not loaded yet
    }
  }, [publisherId])

  if (!publisherId) {
    // Development / unconfigured placeholder
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 font-medium ${className}`}
        style={{ minHeight: 90 }}
        role="complementary"
        aria-label="Advertisement placeholder"
      >
        <div className="text-center">
          <div className="text-lg mb-1">📢</div>
          <div>Ad space · {label}</div>
          <div className="text-[10px] mt-0.5 text-gray-300">Set NEXT_PUBLIC_ADSENSE_ID to enable</div>
        </div>
      </div>
    )
  }

  return (
    <div className={className} role="complementary" aria-label={label}>
      <p className="text-[10px] text-gray-400 text-center mb-1 uppercase tracking-wider">{label}</p>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        style={{ display: 'block' }}
      />
    </div>
  )
}
