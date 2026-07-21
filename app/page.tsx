import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/layout/Logo'
import { ArrowRight, Newspaper, Users, Radio, Tv, PenLine, Shield, Zap, Clock, Eye, TrendingUp, ChevronRight, Compass, FileText } from 'lucide-react'
import { stripHtml } from '@/lib/utils'
import type { Metadata } from 'next'
import { LandingHeroSlideshow } from '@/components/landing/LandingHeroSlideshow'
import { LandingRevealSection } from '@/components/landing/LandingRevealSection'

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

  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Logo size="md" href="" />
          <div className="hidden md:flex items-center gap-0.5">
            <Link href="/social" className="nav-tab-link"><Users size={15} /> Social</Link>
            <Link href="/explore" className="nav-tab-link"><Compass size={15} /> Explore</Link>
            <Link href="/news" className="nav-tab-link"><Newspaper size={15} /> News</Link>
            <Link href="/articles" className="nav-tab-link"><FileText size={15} /> Articles</Link>
            <Link href="/radio" className="nav-tab-link"><Radio size={15} /> Radio</Link>
            <Link href="/tv" className="nav-tab-link"><Tv size={15} /> TV</Link>
          </div>
          <div className="landing-nav-actions">
            <Link href="/login" className="landing-btn ghost">Sign In</Link>
            <Link href="/onboarding" className="landing-btn primary">Sign Up Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero with slideshow */}
      <section className="landing-hero">
        <LandingHeroSlideshow slides={heroSlides} />
        <div className="landing-hero-bg" aria-hidden="true">
          <div className="landing-orb orb-1" />
          <div className="landing-orb orb-2" />
          <div className="landing-orb orb-3" />
        </div>
        <div className="landing-hero-content lfloat-anim lfloat-anim-1">
          <span className="pill landing-pill"><Zap size={13} /> The future of African journalism</span>
          <h1 className="landing-title">
            026<span className="text-gradient-hero">connect</span>
          </h1>
          <p className="landing-subtitle">
            A living newsroom where breaking news meets real conversation.
            Follow journalists, debate the stories that shape Kenya and Africa,
            and be part of the news.
          </p>
          <div className="landing-ctas">
            <Link href="/onboarding" className="landing-btn primary large">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="landing-btn ghost large">
              Sign In
            </Link>
          </div>
          <div className="landing-trust">
            <span>Trusted by thousands of readers across Kenya</span>
          </div>
        </div>
      </section>

      {/* Trending / Top Stories */}
      {top.length > 0 && (
        <LandingRevealSection>
          <section className="landing-section">
            <div className="landing-section-header">
              <div className="landing-section-title-row">
                <TrendingUp size={20} className="landing-section-icon" />
                <h2 className="landing-section-title">Trending Now</h2>
              </div>
              <Link href="/news" className="landing-section-link">View all <ChevronRight size={16} /></Link>
            </div>
            <div className="landing-top-grid">
              {/* Hero card — first article */}
              <Link href={`/article/${top[0].slug}`} className="landing-top-hero">
                {top[0].featured_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={top[0].featured_image} alt="" className="landing-top-hero-img" />
                ) : (
                  <div className="landing-top-hero-fallback" />
                )}
                <div className="landing-top-hero-overlay" />
                <div className="landing-top-hero-content">
                  <span className="landing-top-badge" style={{ background: CATEGORY_COLORS[top[0].category?.name ?? ''] || 'var(--primary)' }}>
                    {top[0].category?.name ?? 'Top Story'}
                  </span>
                  <h3 className="landing-top-hero-title">{top[0].title}</h3>
                  {top[0].excerpt && (
                    <p className="landing-top-hero-excerpt">{stripHtml(top[0].excerpt)}</p>
                  )}
                  <div className="landing-top-meta">
                    <span>{top[0].author?.name ?? 'Staff'}</span>
                    <span><Eye size={12} /> {formatViews(top[0].views ?? 0)}</span>
                  </div>
                </div>
              </Link>

              {/* Side cards */}
              <div className="landing-top-side">
                {top.slice(1, 4).map((a: any) => (
                  <Link key={a.article_id} href={`/article/${a.slug}`} className="landing-top-side-card">
                    {a.featured_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.featured_image} alt="" className="landing-top-side-img" />
                    ) : (
                      <div className="landing-top-side-fallback" />
                    )}
                    <div className="landing-top-side-meta">
                      <span className="landing-top-badge-sm" style={{ color: CATEGORY_COLORS[a.category?.name ?? ''] || 'var(--primary)' }}>
                        {a.category?.name ?? 'News'}
                      </span>
                      <h4 className="landing-top-side-title">{a.title}</h4>
                      <span className="landing-top-side-author">{a.author?.name ?? 'Staff'} &middot; {formatViews(a.views ?? 0)} views</span>
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
        <section className="landing-features">
          <div className="landing-section-header" style={{ marginBottom: '2rem' }}>
            <div className="landing-section-title-row">
              <Zap size={20} className="landing-section-icon" />
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
              <div key={f.title} className="landing-feature" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="landing-feature-icon"><f.icon size={24} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </LandingRevealSection>

      {/* Recent Posts */}
      {recent.length > 0 && (
        <LandingRevealSection>
          <section className="landing-section">
            <div className="landing-section-header">
              <div className="landing-section-title-row">
                <Clock size={20} className="landing-section-icon" />
                <h2 className="landing-section-title">Latest Stories</h2>
              </div>
              <Link href="/news" className="landing-section-link">View all <ChevronRight size={16} /></Link>
            </div>
            <div className="landing-recent-grid">
              {recent.map((a: any) => (
                <Link key={a.article_id} href={`/article/${a.slug}`} className="landing-recent-card">
                  {a.featured_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.featured_image} alt="" className="landing-recent-img" />
                  ) : (
                    <div className="landing-recent-img-fallback" />
                  )}
                  <div className="landing-recent-body">
                    <span className="landing-recent-cat" style={{ color: CATEGORY_COLORS[a.category?.name ?? ''] || 'var(--primary)' }}>
                      {a.category?.name ?? 'News'}
                    </span>
                    <h3 className="landing-recent-title">{a.title}</h3>
                    {a.excerpt && (
                      <p className="landing-recent-excerpt">{stripHtml(a.excerpt)}</p>
                    )}
                    <div className="landing-recent-meta">
                      <span>{a.author?.name ?? 'Staff'}</span>
                      <span><Eye size={12} /> {formatViews(a.views ?? 0)}</span>
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
        <section className="landing-cta-section">
          <h2>Ready to join the story?</h2>
          <p>Start reading, sharing, and shaping the news today.</p>
          <div className="landing-ctas">
            <Link href="/onboarding" className="landing-btn primary large">
              Create Your Account <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </LandingRevealSection>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Logo size="sm" href="" />
          <span>&copy; {new Date().getFullYear()} 026connet!. Made in Kenya.</span>
          <div className="landing-footer-links">
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
