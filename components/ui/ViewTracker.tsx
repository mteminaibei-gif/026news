'use client'

import { useEffect } from 'react'

export function ViewTracker({ articleId }: { articleId: number }) {
  useEffect(() => {
    fetch('/api/analytics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: articleId }),
    }).catch(() => {})
  }, [articleId])

  return null
}
