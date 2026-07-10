'use client'

import { useEffect, useState } from 'react'

interface CountUpNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

/**
 * Animated counter for displaying statistics
 * Counts up from 0 to the target value over specified duration
 */
export function CountUpNumber({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
}: CountUpNumberProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationId: number | null = null

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuad = (t: number) => t * (2 - t)
      const eased = easeOutQuad(progress)

      setCount(Math.floor(value * eased))

      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      } else {
        setCount(value)
      }
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [value, duration])

  const formatted = decimals > 0 
    ? count.toFixed(decimals)
    : count.toLocaleString()

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
