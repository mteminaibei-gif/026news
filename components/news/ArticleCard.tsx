'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDate, formatNumber, stripHtml } from '@/lib/utils'
import { Eye, Clock } from 'lucide-react'

interface ArticleCardProps {
  article: {
    article_id: number
    title: string
    slug: string
    content: string
    excerpt?: string | null
    featured_image?: string | null
    source_reference?: string | null
    views?: number | null
    created_at?: string | null
    author?: { name: string; profile_image?: string | null } | null
    category?: { name: string } | null
  }
  variant?: 'default' | 'horizontal' | 'featured'
}

const CATEGORY_COLORS: Record<string, string> = {
  'World Updates': '#475569', 'Kenya Focus': '#006600', 'Politics & Governance': '#e23b3b',
  'Business & Economy': '#d4a853', 'Tech & Innovation': '#1a73e8', 'Health & Wellness': '#059669',
  'Arts & Culture': '#db2777', 'Sports Arena': '#34a853', 'Opinion & Analysis': '#a21caf',
  'Trending Now': '#f59e0b', 'Features & Profiles': '#6366f1', 'Environment & Climate': '#0d9488',
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
  return <Image src={src} alt={alt} fill={fill} className={className} unoptimized onError={() => setError(true)} sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
}

const hasValidImage = (url?: string | null) =>
  !!url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = hasValidImage(article.featured_image) && !imgError
  const sourceHost = getSourceHost(article.source_reference)
  const catColor = CATEGORY_COLORS[article.category?.name ?? ''] || 'var(--primary)'

  const Placeholder = () => (
    <div className="absolute inset-0 flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, var(--primary-light), var(--surface-2))',
    }}>
      <span className="text-sm font-bold select-none tracking-widest uppercase" style={{ color: 'var(--primary)', opacity: 0.15 }}>
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
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex gap-4 py-4 last:border-0 rounded-xl px-3 group"
        style={{
          borderBottom: '1px solid var(--glass-border)',
          transition: 'all 0.25s var(--ease-out-expo)',
        }}
      >
        <div className="relative w-24 h-20 shrink-0 rounded-xl overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
          {showImage ? (
            <Image
              src={article.featured_image!}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
              sizes="96px"
              onError={() => setImgError(true)}
             loading="lazy"/>
          ) : <Placeholder />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: catColor }}>
            {article.category?.name}
          </p>
          <h5 className="text-sm font-semibold leading-snug line-clamp-2 mb-1.5" style={{ color: 'var(--text-primary)' }}>
            <Link href={`/article/${article.slug}`} className="hover:opacity-80 transition-opacity" style={{ color: 'inherit', textDecoration: 'none' }}>
              {article.title}
            </Link>
          </h5>
          <p className="text-xs flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1"><Eye size={11} /> {formatNumber(article.views ?? 0)}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{article.created_at ? formatDate(article.created_at) : ''}</span>
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
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl overflow-hidden group"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glow-soft)',
        transition: 'all 0.35s var(--ease-out-expo)',
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 0 0 1px oklch(65% 0.12 175 / 0.3), 0 12px 40px -8px oklch(0% 0 0 / 0.15)',
      }}
    >
      <Link href={`/article/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
          {showImage ? (
            <Image
              src={article.featured_image!}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
             loading="lazy"/>
          ) : <Placeholder />}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.06) 0%, transparent 40%)',
            pointerEvents: 'none',
          }} />
        </div>
      </Link>

      <div className="p-5">
        {article.category?.name && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5"
            style={{
              color: catColor,
              background: catColor + '12',
              padding: '3px 10px',
              borderRadius: 999,
              border: `1px solid ${catColor}20`,
            }}
          >
            {article.category.name}
          </span>
        )}

        <h3
          className="font-semibold text-lg leading-snug mb-2 line-clamp-2"
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            color: 'var(--text-primary)',
          }}
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-4"
            style={{
              color: 'var(--primary)',
              transition: 'all 0.2s var(--ease-out-expo)',
            }}
          >
            Source: {sourceHost} ↗
          </a>
        )}

        <div className="flex items-center justify-between pt-4" style={{
          borderTop: '1px solid var(--glass-border)',
        }}>
          <div className="flex items-center gap-2.5">
            {article.author?.profile_image ? (
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{
                border: '2px solid var(--glass-bg)',
                boxShadow: '0 0 0 1px var(--glass-border)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.author.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: 'var(--grad-primary)',
                  color: '#fff',
                  boxShadow: '0 0 0 2px var(--glass-bg), 0 0 0 3px oklch(65% 0.12 175 / 0.2)',
                }}
              >
                {article.author?.name?.charAt(0) ?? 'S'}
              </div>
            )}
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {article.author?.name ?? 'Staff Writer'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
              <Eye size={12} /> {formatNumber(article.views ?? 0)}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
              <Clock size={12} />
              {article.created_at ? formatDate(article.created_at) : ''}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
