import Link from 'next/link'

/**
 * Brand logo — single source of truth for the 026connet! wordmark.
 * Matches the frontpage concept: bold wordmark with a red "connet!" suffix.
 * Use everywhere (navbar, footer, auth, profile, error pages) for consistency.
 */

const BRAND_HUE = '#e23b3b'

interface LogoProps {
  href?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Override the default red suffix colour (e.g. on dark hero panels). */
  suffixColor?: string
  /** Override the base wordmark colour (e.g. on dark hero panels). */
  baseColor?: string
  /** When true the whole wordmark uses the primary text colour (no red). */
  mono?: boolean
  onClick?: () => void
}

const SIZES: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function Logo({
  href = '/',
  className = '',
  size = 'md',
  suffixColor = BRAND_HUE,
  baseColor,
  mono = false,
  onClick,
}: LogoProps) {
  const inner = (
    <span
      className={`${SIZES[size]} font-bold tracking-tight`}
      style={{ color: baseColor ?? 'var(--text-primary)' }}
    >
      026<span style={{ color: mono ? 'inherit' : suffixColor }}>connet!</span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} aria-label="026connet! — home" className={`shrink-0 group inline-flex items-center ${className}`} onClick={onClick}>
        {inner}
      </Link>
    )
  }

  return (
    <span className={`inline-flex items-center ${className}`} onClick={onClick}>
      {inner}
    </span>
  )
}
