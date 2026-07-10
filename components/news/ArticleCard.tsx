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
      <div className="flex gap-4 py-4 border-b-2 border-[#e8f5ea] dark:border-[#223d29] last:border-0 hover:bg-[#f0faf2] dark:hover:bg-[#1a5c2a]/8 transition-all duration-300 rounded-xl px-3 group">
        <div className="relative w-24 h-20 shrink-0 rounded-xl overflow-hidden bg-[#f0faf2] dark:bg-[#1a2e1e] shadow-sm group-hover:shadow-md transition-shadow">
          {showImage ? (
            <Image
              src={article.featured_image!}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
              sizes="96px"
              onError={() => setImgError(true)}
            />
          ) : <Placeholder />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${isKenya ? 'bg-[#c8102e] text-white' : 'bg-[#1a5c2a] text-white dark:bg-[#4caf28] dark:text-[#1a1a1a]'}`}>
              {isKenya ? '🇰🇪 ' : '📰 '}{article.category?.name}
            </span>
          </div>
          <h5 className="text-sm font-bold text-[#1a1a1a] dark:text-[#f8fdf5] leading-snug line-clamp-2 mt-1 mb-2">
            <Link href={`/article/${article.slug}`} className="hover:text-[#1a5c2a] dark:hover:text-[#4caf28] transition-colors">
              {article.title}
            </Link>
          </h5>
          <p className="text-xs text-[#6b7280] dark:text-[#81c784] flex items-center gap-3 font-medium">
            <span className="flex items-center gap-1">👁 {formatNumber(article.views)}</span>
            <span className="flex items-center gap-1">📅 {formatDate(article.created_at)}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <article className="bg-white dark:bg-[#162319] border-2 border-[#e8f5ea] dark:border-[#223d29] rounded-2xl shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-[#1a5c2a] dark:hover:border-[#4caf28] transition-all duration-300 group">
      <Link href={`/article/${article.slug}`}>
        <div className="relative aspect-video bg-[#f0faf2] dark:bg-[#1a2e1e] overflow-hidden">
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
            <div className="absolute top-3 left-3 bg-gradient-to-r from-[#c8102e] to-[#a50d25] text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              🇰🇪 Kenya News
            </div>
          )}
          {/* Kenya flag accent corner */}
          <div className="absolute top-0 right-0 w-12 h-12">
            <div className="absolute inset-0 bg-gradient-to-bl from-[#c8102e] via-[#1a1a1a] to-[#1a5c2a] opacity-80 rounded-bl-2xl"></div>
          </div>
        </div>
      </Link>
      <div className="p-5">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${isKenya ? 'bg-[#c8102e] text-white' : 'bg-[#1a5c2a] text-white dark:bg-[#4caf28] dark:text-[#1a1a1a]'}`}>
            {article.category?.name}
          </span>
          {sourceHost && (
            <span className="text-[9px] text-[#6b7280] dark:text-[#81c784] font-medium">
              {sourceHost}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-black text-lg text-[#1a1a1a] dark:text-[#f8fdf5] leading-tight mt-2 mb-3 line-clamp-2 group-hover:text-[#1a5c2a] dark:group-hover:text-[#4caf28] transition-colors">
          <Link href={`/article/${article.slug}`}>
            {article.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-[#374151] dark:text-[#a5d6aa] line-clamp-2 mb-4 leading-relaxed font-medium">
          {article.excerpt?.trim() || article.content.substring(0, 120)}...
        </p>

        {/* Source link */}
        {sourceHost && (
          <a
            href={article.source_reference ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a5c2a] dark:text-[#4caf28] hover:text-[#2d8a47] dark:hover:text-[#65a30d] mb-4 group/source"
          >
            <span className="w-2 h-2 bg-[#4caf28] rounded-full"></span>
            Source: {sourceHost} 
            <span className="group-hover/source:translate-x-0.5 transition-transform">↗</span>
          </a>
        )}

        {/* Meta info with Kenya flag accent */}
        <div className="flex items-center gap-4 text-xs text-[#6b7280] dark:text-[#81c784] pt-4 border-t-2 border-[#e8f5ea] dark:border-[#223d29] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="text-sm">✍️</span> 
            {article.author?.name ?? 'Staff Writer'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-sm">👁</span> 
            {formatNumber(article.views)}
          </span>
          <span className="ml-auto text-[#1a5c2a] dark:text-[#4caf28] font-bold">
            {formatDate(article.created_at)}
          </span>
        </div>
      </div>
    </article>
  )
}
