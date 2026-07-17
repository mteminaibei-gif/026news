'use client'

import { useEffect, useState } from 'react'

type Health = { radio: Record<string, boolean>; tv: Record<string, boolean> } | null

export function useMediaHealth() {
  const [health, setHealth] = useState<Health>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch('/api/media/health')
        if (res.ok) {
          const data = await res.json()
          if (active) setHealth(data)
        }
      } catch { /* offline-safe: no badges */ }
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  return {
    radioStatus: (id: string) => health?.radio?.[id],
    tvStatus: (id: string) => health?.tv?.[id],
  }
}
