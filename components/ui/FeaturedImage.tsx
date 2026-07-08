'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
}

export function FeaturedImage({ src, alt, className = 'object-cover', sizes, priority }: Props) {
  const [hidden, setHidden] = useState(false)

  if (hidden) return null

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      priority={priority}
      unoptimized
      sizes={sizes ?? '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw'}
      onError={() => setHidden(true)}
    />
  )
}
