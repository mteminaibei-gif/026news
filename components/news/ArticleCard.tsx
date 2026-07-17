'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDate, formatNumber, stripHtml } from '@/lib/utils'

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
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return null }
}

function ArticleImage({ src, alt, fill, className }: {
  src: string; alt: string; fill?: boolean; className?: string
}) {
  const [error, setError] = useState(false)
  if (error) return null
  return <Image src={src} alt={alt} fill={fill} className={className} unoptimized onError={() => setError(true)} />
}

const hasValidImage = (url?: string | null) =>
  !!url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = hasValidImage(article.featured_image) && !imgError
  const sourceHost = getSourceHost(article.source_reference)

  const Placeholder = () => (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
      <span className="text-sm font-bold select-none tracking-widest uppercase" style={{ color: 'var(--primary)', opacity: 0.2 }}>
        {article.category?.name ?? '026connet!'}
      </span>
    </div>
  )

  if (variant === 'horizontal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.35 }}
        className="flex gap-4 py-4 last:border-0 transition-all duration-200 rounded-xl px-3 group"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="relative w-24 h-20 shrink-0 rounded-xl overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
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
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--primary)' }}>
            {article.category?.name}
          </p>
          <h5 className="text-sm font-semibold leading-snug line-clamp-2 mb-1.5" style={{ color: 'var(--text-primary)' }}>
            <Link href={`/article/${article.slug}`} className="hover:opacity-80 transition-opacity" style={{ color: 'inherit', textDecoration: 'none' }}>
              {article.title}
            </Link>
          </h5>
          <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <span>{formatNumber(article.views)} views</span>
            <span>·</span>
            <span>{formatDate(article.created_at)}</span>
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden transition-all duration-300 group"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
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
        </div>
      </Link>

      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--primary)' }}>
          {article.category?.name}
        </p>

        <h3
          className="font-semibold text-lg leading-snug mb-2 line-clamp-2"
          style={{ fontFamily: "'Newsreader', Georgia, serif", color: 'var(--text-primary)' }}
        >
          <Link href={`/article/${article.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {article.title}
          </Link>
        </h3>

        <p className="text-sm line-clamp-2 mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {stripHtml(article.excerpt ?? '').trim() || stripHtml(article.content).substring(0, 120)}...
        </p>

        {sourceHost && (
          <a
            href={article.source_reference ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-4 transition-colors"
            style={{ color: 'var(--primary)' }}
          >
            Source: {sourceHost} ↗
          </a>
        )}

        <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
            >
              {article.author?.name?.charAt(0) ?? 'S'}
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {article.author?.name ?? 'Staff Writer'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatNumber(article.views)} views</span>
            <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>{formatDate(article.created_at)}</span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
