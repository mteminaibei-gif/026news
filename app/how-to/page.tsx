'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Newspaper, Users, MessageSquare, Search, Bell, Bookmark,
  PenLine, BarChart3, DollarSign, Globe, Eye, Heart,
  ChevronRight, ArrowRight, Sparkles, BookOpen, Radio, Tv,
  Share2, Settings, UserPlus, Shield, Zap, Star, Play,
} from 'lucide-react'

function RevealSection({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(30px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function StepCard({ icon: Icon, title, desc, color, index }: { icon: any; title: string; desc: string; color: string; index: number }) {
  return (
    <RevealSection delay={index * 80}>
      <div style={{
        padding: 24, borderRadius: 16,
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
        cursor: 'default',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px -8px ${color}22` }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `${color}18`, border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            <Icon size={20} />
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Step {index + 1}
          </span>
        </div>
        <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
    </RevealSection>
  )
}

function FeatureHighlight({ icon: Icon, label, desc, color }: { icon: any; label: string; desc: string; color: string }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '16px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon size={18} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', lineHeight: 1.55, color: 'var(--text-tertiary)' }}>{desc}</p>
      </div>
    </div>
  )
}

export default function HowToPage() {
  const [tab, setTab] = useState<'reader' | 'author'>('reader')

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)',
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        padding: '48px 24px 40px', textAlign: 'center',
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <RevealSection>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999,
            background: 'var(--primary-light)', color: 'var(--primary)',
            fontSize: '0.72rem', fontWeight: 700, marginBottom: 16,
            border: '1px solid var(--primary-muted)',
          }}>
            <BookOpen size={14} /> Getting Started Guide
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800,
            margin: '0 0 12px', letterSpacing: '-0.03em',
            fontFamily: 'var(--font-display)',
          }}>
            How to Use <span style={{ color: 'var(--primary)' }}>026connet!</span>
          </h1>
          <p style={{
            fontSize: '1rem', color: 'var(--text-secondary)',
            maxWidth: 500, margin: '0 auto 28px', lineHeight: 1.65,
          }}>
            Everything you need to know about navigating the platform, whether you&apos;re here to read or to write.
          </p>
        </RevealSection>

        {/* Tab switcher */}
        <div style={{
          display: 'inline-flex', gap: 4, padding: 4,
          background: 'var(--bg-inset)', borderRadius: 12,
          border: '1px solid var(--border-subtle)',
        }}>
          {([
            { key: 'reader' as const, label: 'I\'m a Reader', icon: Eye },
            { key: 'author' as const, label: 'I\'m an Author', icon: PenLine },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: tab === t.key ? 'var(--bg-surface)' : 'transparent',
                color: tab === t.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>

        {tab === 'reader' ? (
          <>
            {/* Reader Quick Start */}
            <section style={{ padding: '40px 0 32px' }}>
              <RevealSection>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
                  Getting Started as a Reader
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 28px', lineHeight: 1.6 }}>
                  Follow these steps to start exploring news and engaging with the community.
                </p>
              </RevealSection>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                <StepCard icon={UserPlus} title="Create Your Account" desc="Sign up with your email. Choose topics you care about to personalize your feed." color="#1d9bf0" index={0} />
                <StepCard icon={Globe} title="Explore the Feed" desc="Browse trending stories, breaking news, and community posts on your personalized social feed." color="#22c55e" index={1} />
                <StepCard icon={Search} title="Search & Discover" desc="Use the search bar to find specific topics, journalists, or articles. Explore curated categories." color="#f59e0b" index={2} />
                <StepCard icon={Heart} title="Engage" desc="Like, comment, and share stories. Join conversations and express your perspective." color="#ef4444" index={3} />
                <StepCard icon={Bookmark} title="Save for Later" desc="Bookmark articles to read later. Your saved collection is always accessible from your profile." color="#a855f7" index={4} />
                <StepCard icon={Bell} title="Stay Updated" desc="Get notifications for new articles from journalists you follow and trending stories." color="#06b6d4" index={5} />
              </div>
            </section>

            {/* Reader Features */}
            <section style={{ padding: '8px 0 40px' }}>
              <RevealSection>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 20px' }}>Platform Features</h2>
              </RevealSection>
              <RevealSection delay={100}>
                <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '4px 20px' }}>
                  <FeatureHighlight icon={Newspaper} label="News Feed" desc="Browse categorized news from verified sources across Kenya and Africa." color="#1d9bf0" />
                  <FeatureHighlight icon={Users} label="Social Feed" desc="See posts from journalists and community members. React and comment in real-time." color="#22c55e" />
                  <FeatureHighlight icon={MessageSquare} label="Direct Messages" desc="Chat privately with journalists and other readers. Start meaningful conversations." color="#f59e0b" />
                  <FeatureHighlight icon={Radio} label="Live Radio" desc="Stream live radio stations directly from the platform. News you can listen to." color="#ef4444" />
                  <FeatureHighlight icon={Tv} label="Live TV" desc="Watch live TV broadcasts and news coverage from partner stations." color="#a855f7" />
                  <FeatureHighlight icon={Share2} label="Share Stories" desc="Share articles and posts to social media or copy links to share with friends." color="#06b6d4" />
                </div>
              </RevealSection>
            </section>
          </>
        ) : (
          <>
            {/* Author Quick Start */}
            <section style={{ padding: '40px 0 32px' }}>
              <RevealSection>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 8px', fontFamily: 'var(--font-display)' }}>
                  Getting Started as an Author
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 28px', lineHeight: 1.6 }}>
                  Follow these steps to start publishing and building your audience.
                </p>
              </RevealSection>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                <StepCard icon={PenLine} title="Write Your First Article" desc="Open the editor, write your story with rich formatting, add images, and preview before submitting." color="#1d9bf0" index={0} />
                <StepCard icon={Shield} title="Submit for Review" desc="Submit your article to the editorial team. You&apos;ll be notified once it&apos;s reviewed and approved." color="#22c55e" index={1} />
                <StepCard icon={BarChart3} title="Track Performance" desc="Monitor views, engagement, and growth from your author dashboard. See what resonates." color="#f59e0b" index={2} />
                <StepCard icon={Users} title="Build Your Audience" desc="Post on the social feed, engage with readers, and grow your following on the platform." color="#ef4444" index={3} />
                <StepCard icon={DollarSign} title="Earn Revenue" desc="Qualify for the earnings program based on your article views and audience engagement." color="#a855f7" index={4} />
                <StepCard icon={Star} title="Get Featured" desc="Top articles are featured on the homepage and in curated collections for maximum visibility." color="#06b6d4" index={5} />
              </div>
            </section>

            {/* Author Features */}
            <section style={{ padding: '8px 0 40px' }}>
              <RevealSection>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 20px' }}>Author Tools</h2>
              </RevealSection>
              <RevealSection delay={100}>
                <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, padding: '4px 20px' }}>
                  <FeatureHighlight icon={PenLine} label="Rich Editor" desc="Write with a full-featured editor: headings, bold, italic, links, images, and code blocks." color="#1d9bf0" />
                  <FeatureHighlight icon={Eye} label="Preview Mode" desc="See exactly how your article will look before publishing. Fine-tune formatting and layout." color="#22c55e" />
                  <FeatureHighlight icon={BarChart3} label="Analytics Dashboard" desc="Track article views, read time, engagement rates, and audience demographics." color="#f59e0b" />
                  <FeatureHighlight icon={DollarSign} label="Earnings Tracker" desc="Monitor your earnings, view payout history, and track your revenue milestones." color="#ef4444" />
                  <FeatureHighlight icon={MessageSquare} label="Reader Comments" desc="Respond to reader comments, answer questions, and build relationships with your audience." color="#a855f7" />
                  <FeatureHighlight icon={Zap} label="AI Enhancement" desc="Use AI tools to enhance your headlines, summaries, and SEO metadata for better reach." color="#06b6d4" />
                </div>
              </RevealSection>
            </section>
          </>
        )}

        {/* Common tips */}
        <section style={{ padding: '0 0 40px' }}>
          <RevealSection>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px' }}>Quick Tips</h2>
          </RevealSection>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: Search, tip: 'Use / to quick-search from any page', color: '#1d9bf0' },
              { icon: Bell, tip: 'Enable notifications to never miss breaking news', color: '#f59e0b' },
              { icon: Bookmark, tip: 'Save articles to read offline later', color: '#a855f7' },
              { icon: Settings, tip: 'Customize your feed topics in settings', color: '#22c55e' },
            ].map((t, i) => (
              <RevealSection key={i} delay={i * 60}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 12,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  fontSize: '0.78rem', color: 'var(--text-secondary)',
                }}>
                  <t.icon size={16} style={{ color: t.color, flexShrink: 0 }} />
                  {t.tip}
                </div>
              </RevealSection>
            ))}
          </div>
        </section>

        {/* CTA */}
        <RevealSection>
          <div style={{
            textAlign: 'center', padding: '32px 24px', borderRadius: 20,
            background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--bg-surface) 100%)',
            border: '1px solid var(--border-subtle)',
          }}>
            <Sparkles size={24} style={{ color: 'var(--primary)', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>Ready to dive in?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Start exploring the platform now.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/social" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 22px', borderRadius: 10, background: 'var(--grad-primary)',
                color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
                boxShadow: 'var(--glow-primary)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                Go to Feed <ArrowRight size={16} />
              </Link>
              <Link href="/profile" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 22px', borderRadius: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
                transition: 'all 0.2s',
              }}>
                My Profile
              </Link>
            </div>
          </div>
        </RevealSection>
      </div>
    </div>
  )
}
