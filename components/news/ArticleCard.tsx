'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { formatDate, formatNumber } from '@/lib/utils'

interface ArticleCardProps {
  article: {
    article_id: number
    title: string
    slug: string
    content: string
    excerpt?: string | null
    featured_image?: string | null
    source_reference?: string | null
    views: number
    created_at: string
    author?: { name: string; profile_image?: string | null } | null
    category?: { name: string } | null
  }
  variant?: 'default' | 'horizontal' | 'featured'
}

const getSourceHost = (url?: string | null) => {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function ArticleImage({ src, alt, fill, width, height, className }: {
  src: string; alt: string; fill?: boolean; width?: number; height?: number; className?: string
}) {
  const [error, setError] = useState(false)
  if (error) return null
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      unoptimized
      onError={() => setError(true)}
    />
  )
}

const KENYA_CATS = ['Kenya', 'Africa', 'Politics', 'Business', 'Health']

const hasValidImage = (url?: string | null) =>
  !!url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false)
  const isKenya = KENYA_CATS.includes(article.category?.name ?? '')
  const showImage = hasValidImage(article.featured_image) && !imgError
  const sourceHost = getSourceHost(article.source_reference)

  const Placeholder = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1a5c2a]/15 to-[#4caf28]/10 flex items-center justify-center">
      <span className="text-sm font-black text-[#1a5c2a]/20 dark:text-[#4caf28]/20 select-none tracking-widest uppercase">
        {article.category?.name ?? '026NEW'}
      </span>
    </div>
  )

  if (variant === 'horizontal') {
    return (
      <div className="flex gap-3 py-3 border-b border-gray-100 dark:border-[#1a2e1e] last:border-0 hover:bg-[#e8f5ea]/50 dark:hover:bg-[#1a5c2a]/10 transition-all rounded-lg px-1">
        <div className="relative w-20 h-16 shrink-0 rounded-lg overflow-hidden bg-[#e8f5ea] dark:bg-[#1a2e1e]">
          {showImage ? (
            <Image
              src={article.featured_image!}
              alt={article.title}
              fill
              className="object-cover"
              unoptimized
              sizes="80px"
              onError={() => setImgError(true)}
            />
          ) : <Placeholder />}
        </div>
        <div className="min-w-0 flex-1">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isKenya ? 'text-[#c8102e]' : 'text-[#1a5c2a] dark:text-[#4caf28]'}`}>
            {isKenya ? '🇰🇪 ' : ''}{article.category?.name}
          </span>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
            <Link href={`/article/${article.slug}`} className="hover:text-[#1a5c2a] dark:hover:text-[#4caf28] transition-colors">
              {article.title}
            </Link>
          </h5>
          <p className="text-xs text-gray-400 mt-1">
            👁 {formatNumber(article.views)} · {formatDate(article.created_at)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <article className="bg-white dark:bg-[#1a2e1e] border border-transparent dark:border-[#2d4a33]/60 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
      <Link href={`/article/${article.slug}`}>
        <div className="relative aspect-video bg-[#e8f5ea] dark:bg-[#1a2e1e] overflow-hidden">
          {showImage ? (
            <Image
              src={article.featured_image!}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          ) : <Placeholder />}
          {isKenya && (
            <div className="absolute top-2 left-2 bg-[#c8102e] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              🇰🇪 Kenya
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <span className={`text-[11px] font-bold uppercase tracking-wider ${isKenya ? 'text-[#c8102e]' : 'text-[#2d8a47] dark:text-[#4caf28]'}`}>
          {article.category?.name}
        </span>
        <h3 className="font-bold text-gray-900 dark:text-white leading-snug mt-1 mb-1.5 line-clamp-2">
          <Link href={`/article/${article.slug}`} className="hover:text-[#1a5c2a] dark:hover:text-[#4caf28] transition-colors">
            {article.title}
          </Link>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {article.excerpt?.trim() || article.content.substring(0, 110)}...
        </p>
        {sourceHost && (
          <a
            href={article.source_reference ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a5c2a] dark:text-[#4caf28] hover:text-[#4caf28] underline decoration-[#4caf28]/30 mb-2"
          >
            Source: {sourceHost} ↗
          </a>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-[#2d4a33]/40">
          <span>✍️ {article.author?.name ?? 'Staff'}</span>
          <span>👁 {formatNumber(article.views)}</span>
          <span className="ml-auto">{formatDate(article.created_at)}</span>
        </div>
      </div>
    </article>
  )
}
