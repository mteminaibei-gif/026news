import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowRight, Newspaper, Users, Radio, Tv, PenLine, Shield, Zap,
  Clock, Eye, TrendingUp, ChevronRight, Compass, FileText,
  Flame, Star, Search, AtSign, Hash, Globe2,
  Megaphone, Share2, Mail, CheckCircle, Globe, ArrowUpRight, Timer,
} from 'lucide-react'
import { stripHtml } from '@/lib/utils'
import type { Metadata } from 'next'
import { LandingHeroSlideshow } from '@/components/landing/LandingHeroSlideshow'
import { LandingRevealSection } from '@/components/landing/LandingRevealSection'
import { LandingThemeToggle } from '@/components/landing/LandingThemeToggle'

export const metadata: Metadata = {
  title: {
    absolute: '026connet! — Breaking News, Analysis & Freelance Journalism',
  },
  description: 'Kenya\'s leading digital news platform. Breaking news, in-depth analysis, and freelance journalism from across Africa.',
  keywords: ['Kenya news', 'breaking news', 'journalism', 'freelance journalism', 'African news', 'news analysis', 'opinion', '026connet!'],
  openGraph: {
    title: '026connet! — Breaking News, Analysis & Freelance Journalism',
    description: 'Kenya\'s leading digital news platform. Breaking news, in-depth analysis, and freelance journalism from across Africa.',
    siteName: '026connet!',
    type: 'website',
    locale: 'en_KE',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '026connet! — Breaking News, Analysis & Freelance Journalism',
    description: 'Kenya\'s leading digital news platform. Breaking news, in-depth analysis, and freelance journalism from across Africa.',
    site: '@026connet!',
    creator: '@026connet!',
  },
  alternates: {
    canonical: '/',
  },
}

type Article = {
  article_id: number
  slug: string
  title: string
  excerpt: string | null
  content: string
  featured_image: string | null
  views: number
  created_at: string
  category: { name: string } | null
  author: { name: string; profile_image: string | null } | null
}

const CATEGORY_COLORS: Record<string, string> = {
  'World Updates': '#475569',
  'Kenya Focus': '#006600',
  'Politics & Governance': '#e23b3b',
  'Business & Economy': '#d4a853',
  'Tech & Innovation': '#1a73e8',
  'Health & Wellness': '#059669',
  'Arts & Culture': '#db2777',
  'Sports Arena': '#34a853',
  'Opinion & Analysis': '#a21caf',
  'Trending Now': '#f59e0b',
  'Features & Profiles': '#6366f1',
  'Environment & Climate': '#0d9488',
}

function formatViews(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.max(0, now - then)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
}

function readingTime(content: string): string {
  const text = stripHtml(content)
  const words = text.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'S'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function isRecent(dateStr: string): boolean {
  const diff = Date.now() - new Date(dateStr).getTime()
  return diff < 3 * 60 * 60 * 1000
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/social')

  const { data: topArticles } = await supabase
    .from('articles')
    .select('article_id, slug, title, excerpt, content, featured_image, views, created_at, category:categories(name), author:users(name, profile_image)')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(6)

  const { data: recentArticles } = await supabase
    .from('articles')
    .select('article_id, slug, title, excerpt, content, featured_image, views, created_at, category:categories(name), author:users(name, profile_image)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6)

  const heroSlides = (topArticles ?? []).slice(0, 5).map((a: any) => ({
    title: a.title,
    slug: a.slug,
    image: a.featured_image,
    category: a.category?.name ?? 'News',
    author: a.author?.name ?? '026connet!',
  }))

  const top = (topArticles ?? []) as any[]
  const recent = (recentArticles ?? []) as any[]

  const totalArticles = top.length + recent.length
  const uniqueAuthors = new Set([
    ...top.map((a: any) => a.author?.name).filter(Boolean),
    ...recent.map((a: any) => a.author?.name).filter(Boolean),
  ]).size

  return (
    <div className="landing-page" suppressHydrationWarning>
      {/* Nav */}
      <nav className="landing-nav" role="navigation" aria-label="Main navigation">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <span className="landing-nav-brand-text">026<span className="landing-nav-brand-accent">connect</span></span>
          </div>
          <div className="landing-nav-links" role="menubar">
            <Link href="/social" className="landing-nav-link" role="menuitem"><Users size={15} aria-hidden="true" /> Social</Link>
            <Link href="/explore" className="landing-nav-link" role="menuitem"><Compass size={15} aria-hidden="true" /> Explore</Link>
            <Link href="/news" className="landing-nav-link" role="menuitem"><Newspaper size={15} aria-hidden="true" /> News</Link>
            <Link href="/articles" className="landing-nav-link" role="menuitem"><FileText size={15} aria-hidden="true" /> Articles</Link>
            <Link href="/radio" className="landing-nav-link" role="menuitem"><Radio size={15} aria-hidden="true" /> Radio</Link>
            <Link href="/tv" className="landing-nav-link" role="menuitem"><Tv size={15} aria-hidden="true" /> TV</Link>
          </div>
          <div className="landing-nav-actions">
            <LandingThemeToggle />
            <Link href="/login" className="landing-btn ghost" aria-label="Sign in to your account">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero with slideshow */}
      <section className="landing-hero" aria-label="Welcome to 026connet!">
        <LandingHeroSlideshow slides={heroSlides} />
        <div className="landing-hero-bg" aria-hidden="true">
          <div className="landing-orb orb-1" />
          <div className="landing-orb orb-2" />
          <div className="landing-orb orb-3" />
        </div>
        <div className="landing-hero-content lfloat-anim lfloat-anim-1">
          <span className="pill landing-pill"><Zap size={13} aria-hidden="true" /> The future of African journalism</span>
          <h1 className="landing-title">
            026<span className="text-gradient-hero">connect</span>
          </h1>
          <p className="landing-subtitle">
            A living newsroom where breaking news meets real conversation.
            Follow journalists, debate the stories that shape Kenya and Africa,
            and be part of the news.
          </p>
          <div className="landing-ctas">
            <Link href="/onboarding" className="landing-btn primary large" aria-label="Get started for free">
              Get Started Free <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/login" className="landing-btn ghost large" aria-label="Sign in to your account">
              Sign In
            </Link>
          </div>
          <div className="landing-trust" aria-label="Trusted by thousands of readers across Kenya">
            <span>Trusted by thousands of readers across Kenya</span>
          </div>

          {/* Floating animated stats */}
          <div className="landing-hero-stats" aria-label="Platform statistics">
            <div className="landing-hero-stat lfloat-anim lfloat-anim-1">
              <span className="landing-hero-stat-icon"><FileText size={14} aria-hidden="true" /></span>
              <span className="landing-hero-stat-val">{totalArticles}+</span>
              <span className="landing-hero-stat-lbl">Articles</span>
            </div>
            <div className="landing-hero-stat lfloat-anim lfloat-anim-2" style={{ animationDelay: '0.3s' }}>
              <span className="landing-hero-stat-icon"><Users size={14} aria-hidden="true" /></span>
              <span className="landing-hero-stat-val">{uniqueAuthors}+</span>
              <span className="landing-hero-stat-lbl">Authors</span>
            </div>
            <div className="landing-hero-stat lfloat-anim lfloat-anim-2" style={{ animationDelay: '0.45s' }}>
              <span className="landing-hero-stat-icon"><Eye size={14} aria-hidden="true" /></span>
              <span className="landing-hero-stat-val">{formatViews(top.reduce((s: number, a: any) => s + (a.views ?? 0), 0))}+</span>
              <span className="landing-hero-stat-lbl">Views</span>
            </div>
          </div>

          {/* Keyboard shortcut hint */}
          <div className="landing-hero-kbd lfloat-anim lfloat-anim-2" style={{ animationDelay: '0.6s' }} aria-hidden="true">
            <Search size={13} />
            <span>Press <kbd>/</kbd> to search</span>
          </div>
        </div>
      </section>

      {/* Trending / Top Stories */}
      {top.length > 0 && (
        <LandingRevealSection>
          <section className="landing-section" aria-label="Trending stories">
            <div className="landing-section-header">
              <div className="landing-section-title-row">
                <TrendingUp size={20} className="landing-section-icon" aria-hidden="true" />
                <h2 className="landing-section-title">Trending Now</h2>
              </div>
              <Link href="/news" className="landing-section-link" aria-label="View all trending stories">
                View all <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="landing-top-grid">
              {/* Hero card — first article */}
              <Link href={`/article/${top[0].slug}`} className="landing-top-hero" aria-label={`Featured article: ${top[0].title}`}>
                {top[0].featured_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={top[0].featured_image} alt={top[0].title} className="landing-top-hero-img" loading="eager" fetchPriority="high" />
                ) : (
                  <div className="landing-top-hero-fallback" />
                )}
                <div className="landing-top-hero-overlay" />
                <div className="landing-top-hero-content">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="landing-top-badge" style={{ background: CATEGORY_COLORS[top[0].category?.name ?? ''] || 'var(--primary)' }}>
                      {top[0].category?.name ?? 'Top Story'}
                    </span>
                    <span className="landing-top-badge landing-top-featured-badge">
                      <Star size={10} aria-hidden="true" /> Editor&apos;s Pick
                    </span>
                  </div>
                  <h3 className="landing-top-hero-title">{top[0].title}</h3>
                  {top[0].excerpt && (
                    <p className="landing-top-hero-excerpt">{stripHtml(top[0].excerpt)}</p>
                  )}
                  <div className="landing-top-meta">
                    <span><span className="landing-author-avatar-sm">{getInitials(top[0].author?.name)}</span> {top[0].author?.name ?? 'Staff'}</span>
                    <span><Eye size={12} aria-hidden="true" /> {formatViews(top[0].views ?? 0)}</span>
                    <span><Timer size={12} aria-hidden="true" /> {readingTime(top[0].content)}</span>
                  </div>
                </div>
              </Link>

              {/* Side cards */}
              <div className="landing-top-side" role="list" aria-label="More trending stories">
                {top.slice(1, 4).map((a: any) => (
                  <Link key={a.article_id} href={`/article/${a.slug}`} className="landing-top-side-card" role="listitem" aria-label={a.title}>
                    {a.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.featured_image} alt={a.title} className="landing-top-side-img" loading="lazy" />
                    ) : (
                      <div className="landing-top-side-fallback" />
                    )}
                    <div className="landing-top-side-meta">
                      <span className="landing-top-badge-sm" style={{ color: CATEGORY_COLORS[a.category?.name ?? ''] || 'var(--primary)' }}>
                        {a.category?.name ?? 'News'}
                      </span>
                      <h4 className="landing-top-side-title">{a.title}</h4>
                      <div className="landing-top-side-details">
                        <span className="landing-top-side-author">{a.author?.name ?? 'Staff'}</span>
                        <span className="landing-top-side-sep">&middot;</span>
                        <span className="landing-top-side-author">{formatViews(a.views ?? 0)} views</span>
                        <span className="landing-top-side-sep">&middot;</span>
                        <span className="landing-top-side-author">{readingTime(a.content)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </LandingRevealSection>
      )}

      {/* Features */}
      <LandingRevealSection>
        <section className="landing-features" aria-label="Why choose 026connet!">
          <div className="landing-section-header" style={{ marginBottom: '2rem' }}>
            <div className="landing-section-title-row">
              <Zap size={20} className="landing-section-icon" aria-hidden="true" />
              <h2 className="landing-section-title">Why 026connet!?</h2>
            </div>
          </div>
          <div className="landing-features-grid">
            {[
              { icon: Newspaper, title: 'Breaking News', desc: 'Real-time coverage from Kenya and across Africa. Stay informed with stories that matter.' },
              { icon: Users, title: 'Social Feed', desc: 'Join the conversation. Share your thoughts, debate issues, and connect with the community.' },
              { icon: PenLine, title: 'Write & Earn', desc: 'Become a journalist on the platform. Publish stories, build your audience, and earn.' },
              { icon: Radio, title: 'Live Radio & TV', desc: 'Stream live radio and watch TV directly from the platform. News you can see and hear.' },
              { icon: Shield, title: 'Trusted Sources', desc: 'Curated journalism from verified outlets and independent voices across the continent.' },
              { icon: Tv, title: 'Communities', desc: 'Join topic-based communities. From politics to tech, find your tribe and share perspectives.' },
            ].map((f, i) => (
              <article
                key={f.title}
                className="landing-feature"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="landing-feature-header">
                  <span className="landing-feature-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <div className="landing-feature-icon"><f.icon size={24} aria-hidden="true" /></div>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </LandingRevealSection>

      {/* Recent Posts */}
      {recent.length > 0 && (
        <LandingRevealSection>
          <section className="landing-section" aria-label="Latest stories">
            <div className="landing-section-header">
              <div className="landing-section-title-row">
                <Clock size={20} className="landing-section-icon" aria-hidden="true" />
                <h2 className="landing-section-title">Latest Stories</h2>
              </div>
              <Link href="/news" className="landing-section-link" aria-label="View all latest stories">
                View all <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="landing-recent-grid">
              {recent.map((a: any) => (
                <Link key={a.article_id} href={`/article/${a.slug}`} className="landing-recent-card" aria-label={a.title}>
                  {a.featured_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.featured_image} alt={a.title} className="landing-recent-img" loading="lazy" />
                  ) : (
                    <div className="landing-recent-img-fallback" />
                  )}
                  <div className="landing-recent-body">
                    <div className="landing-recent-top-row">
                      <span className="landing-recent-cat" style={{ color: CATEGORY_COLORS[a.category?.name ?? ''] || 'var(--primary)' }}>
                        {a.category?.name ?? 'News'}
                      </span>
                      <div className="landing-recent-badges">
                        {isRecent(a.created_at) && (
                          <span className="landing-badge-new"><Flame size={10} aria-hidden="true" /> New</span>
                        )}
                        {(a.views ?? 0) > 500 && (
                          <span className="landing-badge-hot"><TrendingUp size={10} aria-hidden="true" /> Hot</span>
                        )}
                      </div>
                    </div>
                    <h3 className="landing-recent-title">{a.title}</h3>
                    {a.excerpt && (
                      <p className="landing-recent-excerpt">{stripHtml(a.excerpt)}</p>
                    )}
                    <div className="landing-recent-footer">
                      <div className="landing-recent-author">
                        <span className="landing-author-avatar">{getInitials(a.author?.name)}</span>
                        <span>{a.author?.name ?? 'Staff'}</span>
                      </div>
                      <div className="landing-recent-meta">
                        <span><Timer size={11} aria-hidden="true" /> {readingTime(a.content)}</span>
                        <span><Eye size={11} aria-hidden="true" /> {formatViews(a.views ?? 0)}</span>
                        <span title={new Date(a.created_at).toLocaleString()}>{relativeTime(a.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </LandingRevealSection>
      )}

      {/* CTA */}
      <LandingRevealSection>
        <section className="landing-cta-section" aria-label="Join 026connet!">
          <div className="landing-cta-pattern" aria-hidden="true">
            <div className="landing-cta-dot landing-cta-dot-1" />
            <div className="landing-cta-dot landing-cta-dot-2" />
            <div className="landing-cta-dot landing-cta-dot-3" />
          </div>
          <div className="landing-cta-content">
            <span className="pill landing-pill-cta"><CheckCircle size={13} aria-hidden="true" /> Free forever, no credit card</span>
            <h2>Ready to join the story?</h2>
            <p>Start reading, sharing, and shaping the news today.</p>
            <div className="landing-cta-stats" aria-label="Social proof">
              <span className="landing-cta-stat"><Users size={16} aria-hidden="true" /> Join 10,000+ readers</span>
              <span className="landing-cta-stat-sep" aria-hidden="true" />
              <span className="landing-cta-stat"><Newspaper size={16} aria-hidden="true" /> {totalArticles}+ stories published</span>
              <span className="landing-cta-stat-sep" aria-hidden="true" />
              <span className="landing-cta-stat"><Globe size={16} aria-hidden="true" /> Across Kenya &amp; Africa</span>
            </div>
            <div className="landing-ctas">
              <Link href="/onboarding" className="landing-btn primary large" aria-label="Create your free account">
                Create Your Account <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/news" className="landing-btn ghost large" aria-label="Browse latest news">
                Browse Stories <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </LandingRevealSection>

      {/* Footer */}
      <footer className="landing-footer" role="contentinfo" aria-label="Site footer">
        <div className="landing-footer-top">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <span className="landing-footer-brand-text">026<span className="landing-nav-brand-accent">connect</span></span>
              <p className="landing-footer-tagline">Kenya&apos;s leading digital news platform. Breaking news, in-depth analysis, and freelance journalism from across Africa.</p>
              <div className="landing-footer-social" aria-label="Social media links">
                <a href="https://twitter.com/026connet" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Twitter" className="landing-social-link"><AtSign size={18} /></a>
                <a href="https://facebook.com/026connet" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Facebook" className="landing-social-link"><Globe2 size={18} /></a>
                <a href="https://instagram.com/026connet" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" className="landing-social-link"><Hash size={18} /></a>
                <a href="https://youtube.com/026connet" target="_blank" rel="noopener noreferrer" aria-label="Subscribe on YouTube" className="landing-social-link"><Megaphone size={18} /></a>
                <a href="https://github.com/026connet" target="_blank" rel="noopener noreferrer" aria-label="View our GitHub" className="landing-social-link"><Share2 size={18} /></a>
              </div>
            </div>

            <div className="landing-footer-links-group">
              <h4 className="landing-footer-heading">Platform</h4>
              <Link href="/news">News</Link>
              <Link href="/articles">Articles</Link>
              <Link href="/explore">Explore</Link>
              <Link href="/radio">Radio</Link>
              <Link href="/tv">TV</Link>
            </div>

            <div className="landing-footer-links-group">
              <h4 className="landing-footer-heading">Company</h4>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>

            <div className="landing-footer-newsletter">
              <h4 className="landing-footer-heading">Stay updated</h4>
              <p className="landing-footer-newsletter-desc">Get the latest stories delivered to your inbox.</p>
              <form className="landing-footer-form" aria-label="Newsletter signup">
                <div className="landing-footer-input-wrap">
                  <Mail size={16} aria-hidden="true" className="landing-footer-input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="landing-footer-input"
                    aria-label="Email address for newsletter"
                    suppressHydrationWarning
                  />
                </div>
                <button type="submit" className="landing-footer-submit" aria-label="Subscribe to newsletter">
                  Subscribe <ArrowRight size={14} aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <div className="landing-footer-bottom-inner">
            <span>&copy; {new Date().getFullYear()} 026connet!. Made with ❤️ in Kenya.</span>
            <div className="landing-footer-bottom-links">
              <Link href="/about">About</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
