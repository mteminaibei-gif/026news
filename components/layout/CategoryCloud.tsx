'use client'

import Link from 'next/link'
import { useCategories } from '@/lib/hooks/useCategories'

interface Props {
  title?: string
  className?: string
  style?: React.CSSProperties
  /** 'slug' → /category/[slug] (default); 'query' → /?category=[name] */
  variant?: 'slug' | 'query'
}

/**
 * Presentational list of all categories as links.
 * Subscribes to realtime changes so newly created/edited categories
 * appear without a reload.
 */
export function CategoryCloud({ title = 'Categories', className, style, variant = 'slug' }: Props) {
  const { categories } = useCategories()

  return (
    <div
      className={className}
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 16,
        padding: 'var(--space-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--card-shadow)',
        ...style,
      }}
    >
      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-md)',
          fontFamily: "'Newsreader', Georgia, serif",
        }}
      >
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.category_id}
            href={variant === 'query' ? `/?category=${encodeURIComponent(cat.name)}` : `/category/${cat.slug}`}
            className="cat-pill"
            style={{
              padding: '6px 16px',
              borderRadius: 9999,
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            {cat.icon ? `${cat.icon} ` : ''}{cat.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
