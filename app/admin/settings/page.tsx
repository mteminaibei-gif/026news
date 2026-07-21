'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SettingsLayout, SettingsSection, SettingRow } from '@/components/settings'
import { Toggle, Button, Input, Card } from '@/components/ui'
import { Settings, Palette, CreditCard, ShieldCheck, Plug, Search, Server } from 'lucide-react'

const ADMIN_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'monetization', label: 'Monetization', icon: CreditCard },
  { id: 'content', label: 'Content & Moderation', icon: ShieldCheck },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'seo', label: 'SEO & Meta', icon: Search },
  { id: 'advanced', label: 'Advanced', icon: Server },
]

type StrNum = string | number

interface PanelState {
  general: { site_name: string; tagline: string; contact_email: string; app_url: string; support_email: string; site_logo?: string; favicon?: string; default_language: string; timezone: string; date_format: string; currency_display: string; open_registration: boolean; email_verification: boolean; google_oauth: boolean; github_oauth: boolean; invite_only: boolean }
  appearance: { breaking_ticker: boolean; hero_slideshow: boolean; trending_sidebar: boolean; newsletter_widget: boolean; rss_feed_section: boolean; chat_widget: boolean; primary_color: string; accent_color: string; default_theme: string; articles_per_page: number; slideshow_interval: number; default_feed_tab: string }
  monetization: { revenue_share: number; min_payout: number; payout_speed: string; sponsored_article: number; display_ads: number; newsletter_sponsor: number; homepage_feature: number; mpesa_env: string; mpesa_shortcode: string; mpesa_consumer_key: string; mpesa_consumer_secret: string; mpesa_passkey: string; mpesa_callback: string }
  content: { auto_approve_authors: boolean; require_editorial_review: boolean; allow_self_publishing: boolean; ai_moderation: boolean; external_link_approval: boolean; community_reports: boolean; auto_hide_reports: boolean; profanity_filter: boolean; ai_confidence: number; min_word_count: number; max_tags: number; auto_audio: boolean; reading_time: boolean; related_articles: boolean }
  integrations: { resend_key: string; resend_from: string; resend_reply: string; r2_endpoint: string; r2_bucket: string; r2_key: string; r2_secret: string; r2_cdn: string; r2_max_size: number; openai_key: string; gcp_tts_key: string; tts_voice: string }
  seo: { meta_title_template: string; meta_description: string; og_image: string; twitter: string; facebook: string; linkedin: string; instagram: string; ga_id: string; head_script: string; auto_sitemap: boolean; index_articles: boolean; index_authors: boolean; robots_txt: string }
  advanced: { redis_url: string; feed_cache_ttl: number; article_cache_ttl: number; rate_limiting: boolean; cors_restriction: boolean; brute_force: boolean; force_https: boolean; allowed_origins: string; backup_freq: string; backup_retention: string }
  publishing: { rss_auto_publish: boolean; rss_max_per_fetch: number; inhouse_publish_limit: number }
  admin_notifications: Record<string, boolean>
  security: Record<string, boolean>
}

const DEFAULTS: PanelState = {
  general: {
    site_name: '026Newsblog',
    tagline: "Stories that matter, from voices that count.",
    contact_email: 'hello@026newsblog.com',
    app_url: 'https://026newsblog.vercel.app',
    support_email: 'hello@026newsblog.com',
    site_logo: '',
    favicon: '',
    default_language: 'English (en-US)',
    timezone: 'Africa/Nairobi (EAT, UTC+3)',
    date_format: 'Jul 12, 2026',
    currency_display: 'USD ($) with KES equivalent',
    open_registration: true,
    email_verification: true,
    google_oauth: true,
    github_oauth: true,
    invite_only: false,
  },
  appearance: {
    breaking_ticker: true,
    hero_slideshow: true,
    trending_sidebar: true,
    newsletter_widget: true,
    rss_feed_section: true,
    chat_widget: true,
    primary_color: '#1a8a6e',
    accent_color: '#f97316',
    default_theme: 'Light',
    articles_per_page: 10,
    slideshow_interval: 5,
    default_feed_tab: 'For You (Personalized)',
  },
  monetization: {
    revenue_share: 70,
    min_payout: 50,
    payout_speed: 'Within 24 hours',
    sponsored_article: 500,
    display_ads: 200,
    newsletter_sponsor: 150,
    homepage_feature: 800,
    mpesa_env: 'Production',
    mpesa_shortcode: '174379',
    mpesa_consumer_key: '',
    mpesa_consumer_secret: '',
    mpesa_passkey: '',
    mpesa_callback: 'https://026newsblog.vercel.app/api/mpesa/callback',
  },
  content: {
    auto_approve_authors: false,
    require_editorial_review: true,
    allow_self_publishing: true,
    ai_moderation: true,
    external_link_approval: true,
    community_reports: true,
    auto_hide_reports: true,
    profanity_filter: false,
    ai_confidence: 80,
    min_word_count: 300,
    max_tags: 8,
    auto_audio: true,
    reading_time: true,
    related_articles: true,
  },
  integrations: {
    resend_key: '',
    resend_from: 'noreply@026newsblog.com',
    resend_reply: 'hello@026newsblog.com',
    r2_endpoint: 'https://026nb.r2.cloudflarestorage.com',
    r2_bucket: '026newsblog-uploads',
    r2_key: '',
    r2_secret: '',
    r2_cdn: 'https://cdn.026newsblog.com',
    r2_max_size: 10,
    openai_key: '',
    gcp_tts_key: '',
    tts_voice: 'en-US-Neural2-D (Male, Professional)',
  },
  seo: {
    meta_title_template: '{title} · 026Newsblog',
    meta_description: '026Newsblog is East Africa’s creator-first news platform. Read stories on technology, business, culture, and innovation from Africa’s best writers.',
    og_image: '',
    twitter: '@026newsblog',
    facebook: 'https://facebook.com/026newsblog',
    linkedin: 'https://linkedin.com/company/026newsblog',
    instagram: '@026newsblog',
    ga_id: '',
    head_script: '',
    auto_sitemap: true,
    index_articles: true,
    index_authors: true,
    robots_txt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /settings\nSitemap: https://026newsblog.vercel.app/sitemap.xml',
  },
  advanced: {
    redis_url: '',
    feed_cache_ttl: 300,
    article_cache_ttl: 3600,
    rate_limiting: true,
    cors_restriction: true,
    brute_force: true,
    force_https: true,
    allowed_origins: 'https://026newsblog.vercel.app\nhttps://www.026newsblog.vercel.app',
    backup_freq: 'Daily',
    backup_retention: '30 days',
  },
  publishing: {
    rss_auto_publish: true,
    rss_max_per_fetch: 20,
    inhouse_publish_limit: 10,
  },
  admin_notifications: {
    new_submission: true,
    article_decision: true,
    new_user: true,
    flagged_comment: true,
    payout_request: true,
  },
  security: {
    two_factor: false,
    email_verification: true,
    rate_limiting: true,
    block_vpn: false,
  },
}

const inputCls = 'field-input'
const num = (v: StrNum) => (typeof v === 'number' ? v : parseInt(String(v)) || 0)

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [admin, setAdmin] = useState<{ name: string; profile_image: string | null } | null>(null)

  const [data, setData] = useState<PanelState>(DEFAULTS)

  const set = <K extends keyof PanelState>(key: K, patch: Partial<PanelState[K]>) => {
    setData(prev => ({ ...prev, [key]: { ...prev[key], ...patch } } as PanelState))
    setSaved(false)
  }

  const load = useCallback(async () => {
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: adminData } = await supabase
          .from('users')
          .select('name, profile_image')
          .eq('email', user.email ?? '')
          .single() as { data: { name: string; profile_image: string | null } | null }
        if (adminData) setAdmin({ name: adminData.name, profile_image: adminData.profile_image })
        else setAdmin({ name: user.email?.split('@')[0] || 'Admin', profile_image: null })
      }

      const { data: rows } = await (supabase.from('site_settings') as any).select('key, value')
      if (rows) {
        const map: Record<string, any> = {}
        rows.forEach((r: { key: string; value: any }) => (map[r.key] = r.value))
        const merged = { ...DEFAULTS } as PanelState
        ;(Object.keys(DEFAULTS) as (keyof PanelState)[]).forEach(k => {
          if (map[k]) (merged as any)[k] = { ...(DEFAULTS as any)[k], ...map[k] }
        })
        setData(merged)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaved(false)

    const KEY_MAP: Record<string, keyof PanelState> = {
      general: 'general',
      appearance: 'appearance',
      monetization: 'monetization',
      content: 'content',
      integrations: 'integrations',
      seo: 'seo',
      advanced: 'advanced',
    }
    const dbKey = KEY_MAP[activeTab] ?? activeTab

    try {
      const supabase = createClient()
      const { error } = await (supabase.from('site_settings') as any).upsert(
        { key: dbKey, value: data[dbKey as keyof PanelState] },
        { onConflict: 'key' }
      )
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading settings…
      </div>
    )
  }

  return (
    <>
      <SettingsLayout
        tabs={ADMIN_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="Site Settings"
        description="Configure platform behavior, appearance, integrations, and policies"
      >
        {saveError && (
          <Card variant="filled" padding="md" style={{ background: 'var(--error-light)', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{saveError}</p>
          </Card>
        )}
        {saved && (
          <Card variant="filled" padding="md" style={{ background: 'var(--success-light)', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>Settings saved successfully</p>
          </Card>
        )}

        {/* GENERAL */}
        {activeTab === 'general' && (
          <div>
            <section className="section-card">
              <h2 className="section-title">Site Identity</h2>
              <p className="section-desc">Basic information about your platform</p>
              <div className="field-row">
                <div className="field"><label className="field-label">Site Name</label><Input className={inputCls} value={data.general.site_name} onChange={e => set('general', { site_name: e.target.value })} /></div>
                <div className="field"><label className="field-label">Tagline</label><Input className={inputCls} value={data.general.tagline} onChange={e => set('general', { tagline: e.target.value })} /></div>
              </div>
              <div className="field"><label className="field-label">Site URL</label><Input className={inputCls} type="url" value={data.general.app_url} onChange={e => set('general', { app_url: e.target.value })} /><span className="field-hint">Used for generating canonical URLs, sitemap, and share links</span></div>
              <div className="field"><label className="field-label">Support Email</label><Input className={inputCls} type="email" value={data.general.support_email} onChange={e => set('general', { support_email: e.target.value })} /></div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Regional Settings</h2>
              <p className="section-desc">Localization and timezone configuration</p>
              <div className="field-row">
                <div className="field"><label className="field-label">Default Language</label><select className={inputCls} value={data.general.default_language} onChange={e => set('general', { default_language: e.target.value })}><option>English (en-US)</option><option>Swahili (sw-KE)</option><option>French (fr-FR)</option></select></div>
                <div className="field"><label className="field-label">Timezone</label><select className={inputCls} value={data.general.timezone} onChange={e => set('general', { timezone: e.target.value })}><option>Africa/Nairobi (EAT, UTC+3)</option><option>Africa/Lagos (WAT, UTC+1)</option><option>Africa/Johannesburg (SAST, UTC+2)</option></select></div>
              </div>
              <div className="field-row">
                <div className="field"><label className="field-label">Date Format</label><select className={inputCls} value={data.general.date_format} onChange={e => set('general', { date_format: e.target.value })}><option>Jul 12, 2026</option><option>12/07/2026</option><option>2026-07-12</option><option>12 July 2026</option></select></div>
                <div className="field"><label className="field-label">Currency Display</label><select className={inputCls} value={data.general.currency_display} onChange={e => set('general', { currency_display: e.target.value })}><option>USD ($) with KES equivalent</option><option>KES only</option><option>USD only</option></select></div>
              </div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Registration & Access</h2>
              <p className="section-desc">Control who can sign up and how</p>
              <div className="toggle-list">
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Open Registration</div><div className="toggle-desc">Allow new readers to create accounts</div></div><Toggle checked={data.general.open_registration} onChange={v => set('general', { open_registration: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Email Verification Required</div><div className="toggle-desc">Users must verify email before accessing full features</div></div><Toggle checked={data.general.email_verification} onChange={v => set('general', { email_verification: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Google OAuth Login</div><div className="toggle-desc">Allow sign in with Google accounts</div></div><Toggle checked={data.general.google_oauth} onChange={v => set('general', { google_oauth: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">GitHub OAuth Login</div><div className="toggle-desc">Allow sign in with GitHub accounts</div></div><Toggle checked={data.general.github_oauth} onChange={v => set('general', { github_oauth: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Invite-Only Mode</div><div className="toggle-desc">Require an invitation code to register (overrides open registration)</div></div><Toggle checked={data.general.invite_only} onChange={v => set('general', { invite_only: v })} /></div>
              </div>
            </section>
          </div>
        )}

        {/* APPEARANCE */}
        {activeTab === 'appearance' && (
          <div>
            <section className="section-card">
              <h2 className="section-title">Homepage Layout</h2>
              <p className="section-desc">Configure what appears on the main page</p>
              <div className="toggle-list">
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Breaking News Ticker</div><div className="toggle-desc">Show scrolling ticker at top of homepage</div></div><Toggle checked={data.appearance.breaking_ticker} onChange={v => set('appearance', { breaking_ticker: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Hero Slideshow</div><div className="toggle-desc">Featured article carousel in hero section</div></div><Toggle checked={data.appearance.hero_slideshow} onChange={v => set('appearance', { hero_slideshow: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Trending Sidebar</div><div className="toggle-desc">Show trending articles in sidebar</div></div><Toggle checked={data.appearance.trending_sidebar} onChange={v => set('appearance', { trending_sidebar: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Newsletter Signup Widget</div><div className="toggle-desc">Display email signup in sidebar</div></div><Toggle checked={data.appearance.newsletter_widget} onChange={v => set('appearance', { newsletter_widget: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">RSS Feed Section</div><div className="toggle-desc">Display aggregated external content on homepage</div></div><Toggle checked={data.appearance.rss_feed_section} onChange={v => set('appearance', { rss_feed_section: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Chat Widget</div><div className="toggle-desc">Floating chat button on all pages</div></div><Toggle checked={data.appearance.chat_widget} onChange={v => set('appearance', { chat_widget: v })} /></div>
              </div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Brand Colors</h2>
              <p className="section-desc">Customize the platform color palette</p>
              <div className="field-row">
                <div className="field"><label className="field-label">Primary Color</label><div className="color-row"><input type="color" className="color-swatch" value={data.appearance.primary_color} onChange={e => set('appearance', { primary_color: e.target.value })} /><input className={`${inputCls} color-input`} value={data.appearance.primary_color} onChange={e => set('appearance', { primary_color: e.target.value })} /><span className="color-label">Buttons, links, accents</span></div></div>
                <div className="field"><label className="field-label">Accent Color</label><div className="color-row"><input type="color" className="color-swatch" value={data.appearance.accent_color} onChange={e => set('appearance', { accent_color: e.target.value })} /><input className={`${inputCls} color-input`} value={data.appearance.accent_color} onChange={e => set('appearance', { accent_color: e.target.value })} /><span className="color-label">Highlights, badges</span></div></div>
              </div>
              <div className="field"><label className="field-label">Default Theme</label><select className={inputCls} style={{ maxWidth: 200 }} value={data.appearance.default_theme} onChange={e => set('appearance', { default_theme: e.target.value })}><option>Light</option><option>Dark</option><option>Follow System</option></select><span className="field-hint">Users can still toggle their own preference</span></div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Feed Settings</h2>
              <p className="section-desc">Control article feed behavior</p>
              <div className="field-row">
                <div className="field"><label className="field-label">Articles Per Page (Infinite Scroll Batch)</label><div className="inline-edit"><input type="number" className={inputCls} value={data.appearance.articles_per_page} style={{ maxWidth: 80 }} onChange={e => set('appearance', { articles_per_page: num(e.target.value) })} /><span className="inline-unit">articles per load</span></div></div>
                <div className="field"><label className="field-label">Hero Slideshow Interval</label><div className="inline-edit"><input type="number" className={inputCls} value={data.appearance.slideshow_interval} style={{ maxWidth: 80 }} onChange={e => set('appearance', { slideshow_interval: num(e.target.value) })} /><span className="inline-unit">seconds</span></div></div>
              </div>
              <div className="field"><label className="field-label">Default Feed Tab</label><select className={inputCls} style={{ maxWidth: 200 }} value={data.appearance.default_feed_tab} onChange={e => set('appearance', { default_feed_tab: e.target.value })}><option>For You (Personalized)</option><option>Recent</option><option>Popular</option></select></div>
            </section>
          </div>
        )}

        {/* MONETIZATION */}
        {activeTab === 'monetization' && (
          <div>
            <section className="section-card">
              <h2 className="section-title">Revenue Configuration</h2>
              <p className="section-desc">How earnings are split between authors and platform</p>
              <div className="alert alert-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                Changes to revenue split only apply to new earnings. Existing balances are not affected.
              </div>
              <div className="field">
                <label className="field-label">Author Revenue Share</label>
                <div className="slider-row"><input type="range" className="slider" min={50} max={90} value={data.monetization.revenue_share} onChange={e => set('monetization', { revenue_share: num(e.target.value) })} /><span className="slider-value">{data.monetization.revenue_share}%</span></div>
                <span className="field-hint">Platform retains: <strong>{100 - data.monetization.revenue_share}%</strong></span>
              </div>
              <div className="field-row">
                <div className="field"><label className="field-label">Minimum Withdrawal (USD)</label><div className="inline-edit"><span className="inline-unit">$</span><input type="number" className={inputCls} value={data.monetization.min_payout} style={{ maxWidth: 80 }} onChange={e => set('monetization', { min_payout: num(e.target.value) })} /><span className="inline-unit">minimum balance</span></div></div>
                <div className="field"><label className="field-label">Payout Processing Time</label><select className={inputCls} value={data.monetization.payout_speed} onChange={e => set('monetization', { payout_speed: e.target.value })}><option>Within 1 hour</option><option>Within 24 hours</option><option>Within 48 hours</option><option>Weekly batch</option></select></div>
              </div>
            </section>

            <section className="section-card">
              <h2 className="section-title">M-Pesa Configuration</h2>
              <p className="section-desc">Safaricom Daraja API credentials for payouts</p>
              <div className="alert alert-warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                These credentials are sensitive. Only share with authorized personnel.
              </div>
              <div className="field-row">
                <div className="field"><label className="field-label">Environment</label><select className={inputCls} value={data.monetization.mpesa_env} onChange={e => set('monetization', { mpesa_env: e.target.value })}><option>Sandbox (Testing)</option><option>Production</option></select></div>
                <div className="field"><label className="field-label">Business Shortcode</label><Input className={inputCls} value={data.monetization.mpesa_shortcode} onChange={e => set('monetization', { mpesa_shortcode: e.target.value })} placeholder="e.g. 174379" /></div>
              </div>
              <div className="field-row">
                <div className="field"><label className="field-label">Consumer Key</label><Input className={inputCls} type="password" value={data.monetization.mpesa_consumer_key} onChange={e => set('monetization', { mpesa_consumer_key: e.target.value })} /></div>
                <div className="field"><label className="field-label">Consumer Secret</label><Input className={inputCls} type="password" value={data.monetization.mpesa_consumer_secret} onChange={e => set('monetization', { mpesa_consumer_secret: e.target.value })} /></div>
              </div>
              <div className="field"><label className="field-label">Passkey</label><Input className={inputCls} type="password" value={data.monetization.mpesa_passkey} onChange={e => set('monetization', { mpesa_passkey: e.target.value })} /></div>
              <div className="field"><label className="field-label">Callback URL</label><Input className={inputCls} type="url" value={data.monetization.mpesa_callback} onChange={e => set('monetization', { mpesa_callback: e.target.value })} /><span className="field-hint">Safaricom sends payment confirmations to this URL</span></div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Advertising Rates</h2>
              <p className="section-desc">Default pricing shown to potential advertisers</p>
              <div className="field-row">
                <div className="field"><label className="field-label">Sponsored Article</label><div className="inline-edit"><span className="inline-unit">$</span><input type="number" className={inputCls} value={data.monetization.sponsored_article} style={{ maxWidth: 80 }} onChange={e => set('monetization', { sponsored_article: num(e.target.value) })} /><span className="inline-unit">per article</span></div></div>
                <div className="field"><label className="field-label">Display Ads</label><div className="inline-edit"><span className="inline-unit">$</span><input type="number" className={inputCls} value={data.monetization.display_ads} style={{ maxWidth: 80 }} onChange={e => set('monetization', { display_ads: num(e.target.value) })} /><span className="inline-unit">per week</span></div></div>
              </div>
              <div className="field-row">
                <div className="field"><label className="field-label">Newsletter Sponsor</label><div className="inline-edit"><span className="inline-unit">$</span><input type="number" className={inputCls} value={data.monetization.newsletter_sponsor} style={{ maxWidth: 80 }} onChange={e => set('monetization', { newsletter_sponsor: num(e.target.value) })} /><span className="inline-unit">per send</span></div></div>
                <div className="field"><label className="field-label">Homepage Feature</label><div className="inline-edit"><span className="inline-unit">$</span><input type="number" className={inputCls} value={data.monetization.homepage_feature} style={{ maxWidth: 80 }} onChange={e => set('monetization', { homepage_feature: num(e.target.value) })} /><span className="inline-unit">per 24 hours</span></div></div>
              </div>
            </section>
          </div>
        )}

        {/* CONTENT & MODERATION */}
        {activeTab === 'content' && (
          <div>
            <section className="section-card">
              <h2 className="section-title">Author Management</h2>
              <p className="section-desc">Control the author application and publishing process</p>
              <div className="toggle-list">
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Auto-Approve Authors</div><div className="toggle-desc">Automatically approve applications with verified portfolios (skip manual review)</div></div><Toggle checked={data.content.auto_approve_authors} onChange={v => set('content', { auto_approve_authors: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Require Editorial Review</div><div className="toggle-desc">New authors must have first 3 articles reviewed before auto-publishing</div></div><Toggle checked={data.content.require_editorial_review} onChange={v => set('content', { require_editorial_review: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Allow Self-Publishing</div><div className="toggle-desc">Authors can publish directly without admin approval (after probation)</div></div><Toggle checked={data.content.allow_self_publishing} onChange={v => set('content', { allow_self_publishing: v })} /></div>
              </div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Content Moderation</h2>
              <p className="section-desc">AI-powered and community moderation settings</p>
              <div className="toggle-list">
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">AI Content Moderation</div><div className="toggle-desc">Automatically flag comments using OpenAI Moderation API</div></div><Toggle checked={data.content.ai_moderation} onChange={v => set('content', { ai_moderation: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">External Link Approval</div><div className="toggle-desc">Hold comments with external links for manual review</div></div><Toggle checked={data.content.external_link_approval} onChange={v => set('content', { external_link_approval: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Community Reports</div><div className="toggle-desc">Allow users to report comments and articles</div></div><Toggle checked={data.content.community_reports} onChange={v => set('content', { community_reports: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Auto-Hide on Reports</div><div className="toggle-desc">Automatically hide content after 3 community reports (pending review)</div></div><Toggle checked={data.content.auto_hide_reports} onChange={v => set('content', { auto_hide_reports: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Profanity Filter</div><div className="toggle-desc">Block comments containing profanity</div></div><Toggle checked={data.content.profanity_filter} onChange={v => set('content', { profanity_filter: v })} /></div>
              </div>
              <div className="field" style={{ marginTop: 20 }}><label className="field-label">AI Confidence Threshold for Auto-Flag</label><div className="slider-row"><input type="range" className="slider" min={50} max={99} value={data.content.ai_confidence} onChange={e => set('content', { ai_confidence: num(e.target.value) })} /><span className="slider-value">{data.content.ai_confidence}%</span></div><span className="field-hint">Content flagged at or above this confidence level goes to moderation queue</span></div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Article Settings</h2>
              <p className="section-desc">Default article behavior</p>
              <div className="field-row">
                <div className="field"><label className="field-label">Minimum Word Count</label><div className="inline-edit"><input type="number" className={inputCls} value={data.content.min_word_count} style={{ maxWidth: 80 }} onChange={e => set('content', { min_word_count: num(e.target.value) })} /><span className="inline-unit">words</span></div></div>
                <div className="field"><label className="field-label">Maximum Tags</label><div className="inline-edit"><input type="number" className={inputCls} value={data.content.max_tags} style={{ maxWidth: 80 }} onChange={e => set('content', { max_tags: num(e.target.value) })} /><span className="inline-unit">per article</span></div></div>
              </div>
              <div className="toggle-list">
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Auto-Generate Audio</div><div className="toggle-desc">Automatically create AI-narrated audio for published articles</div></div><Toggle checked={data.content.auto_audio} onChange={v => set('content', { auto_audio: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Reading Time Display</div><div className="toggle-desc">Show estimated reading time on article cards</div></div><Toggle checked={data.content.reading_time} onChange={v => set('content', { reading_time: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Related Articles</div><div className="toggle-desc">Show related content at the end of articles</div></div><Toggle checked={data.content.related_articles} onChange={v => set('content', { related_articles: v })} /></div>
              </div>
            </section>
          </div>
        )}

        {/* INTEGRATIONS */}
        {activeTab === 'integrations' && (
          <div>
            <section className="section-card">
              <h2 className="section-title">Email Service (Resend)</h2>
              <p className="section-desc">Email delivery for notifications, digests, and transactional emails</p>
              <div className="field"><label className="field-label">API Key</label><Input className={inputCls} type="password" value={data.integrations.resend_key} onChange={e => set('integrations', { resend_key: e.target.value })} /><span className="field-hint">From resend.com dashboard</span></div>
              <div className="field-row">
                <div className="field"><label className="field-label">From Email</label><Input className={inputCls} type="email" value={data.integrations.resend_from} onChange={e => set('integrations', { resend_from: e.target.value })} /></div>
                <div className="field"><label className="field-label">Reply-To Email</label><Input className={inputCls} type="email" value={data.integrations.resend_reply} onChange={e => set('integrations', { resend_reply: e.target.value })} /></div>
              </div>
              <div className="alert alert-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Connected · Last email sent 2 hours ago
              </div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Storage (Cloudflare R2)</h2>
              <p className="section-desc">File uploads for images, documents, and audio</p>
              <div className="field-row">
                <div className="field"><label className="field-label">Endpoint URL</label><Input className={inputCls} type="url" value={data.integrations.r2_endpoint} onChange={e => set('integrations', { r2_endpoint: e.target.value })} /></div>
                <div className="field"><label className="field-label">Bucket Name</label><Input className={inputCls} value={data.integrations.r2_bucket} onChange={e => set('integrations', { r2_bucket: e.target.value })} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label className="field-label">Access Key ID</label><Input className={inputCls} type="password" value={data.integrations.r2_key} onChange={e => set('integrations', { r2_key: e.target.value })} /></div>
                <div className="field"><label className="field-label">Secret Access Key</label><Input className={inputCls} type="password" value={data.integrations.r2_secret} onChange={e => set('integrations', { r2_secret: e.target.value })} /></div>
              </div>
              <div className="field"><label className="field-label">Public CDN URL</label><Input className={inputCls} type="url" value={data.integrations.r2_cdn} onChange={e => set('integrations', { r2_cdn: e.target.value })} /></div>
              <div className="field"><label className="field-label">Max Upload Size</label><div className="inline-edit"><input type="number" className={inputCls} value={data.integrations.r2_max_size} style={{ maxWidth: 80 }} onChange={e => set('integrations', { r2_max_size: num(e.target.value) })} /><span className="inline-unit">MB</span></div></div>
            </section>

            <section className="section-card">
              <h2 className="section-title">AI Services</h2>
              <p className="section-desc">APIs for content moderation and text-to-speech</p>
              <div className="field"><label className="field-label">OpenAI API Key (Moderation)</label><Input className={inputCls} type="password" value={data.integrations.openai_key} onChange={e => set('integrations', { openai_key: e.target.value })} /><span className="field-hint">Used for comment and article moderation</span></div>
              <div className="field"><label className="field-label">Google Cloud TTS API Key</label><Input className={inputCls} type="password" value={data.integrations.gcp_tts_key} onChange={e => set('integrations', { gcp_tts_key: e.target.value })} /><span className="field-hint">Used for AI-narrated audio generation</span></div>
              <div className="field"><label className="field-label">TTS Voice Model</label><select className={inputCls} style={{ maxWidth: 320 }} value={data.integrations.tts_voice} onChange={e => set('integrations', { tts_voice: e.target.value })}><option>en-US-Neural2-D (Male, Professional)</option><option>en-US-Neural2-C (Female, Professional)</option><option>en-US-Neural2-F (Female, Warm)</option><option>en-US-Neural2-A (Male, Casual)</option></select></div>
            </section>
          </div>
        )}

        {/* SEO & META */}
        {activeTab === 'seo' && (
          <div>
            <section className="section-card">
              <h2 className="section-title">SEO Defaults</h2>
              <p className="section-desc">Default meta tags for pages without custom ones</p>
              <div className="field"><label className="field-label">Default Meta Title Template</label><Input className={inputCls} value={data.seo.meta_title_template} onChange={e => set('seo', { meta_title_template: e.target.value })} /><span className="field-hint">Use {'{title}'} as placeholder for page-specific titles</span></div>
              <div className="field"><label className="field-label">Default Meta Description</label><textarea className={inputCls} value={data.seo.meta_description} onChange={e => set('seo', { meta_description: e.target.value })} /></div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Social Media</h2>
              <p className="section-desc">Platform social accounts for linking and sharing</p>
              <div className="field-row">
                <div className="field"><label className="field-label">Twitter / X Handle</label><Input className={inputCls} value={data.seo.twitter} onChange={e => set('seo', { twitter: e.target.value })} /></div>
                <div className="field"><label className="field-label">Facebook Page</label><Input className={inputCls} type="url" value={data.seo.facebook} onChange={e => set('seo', { facebook: e.target.value })} /></div>
              </div>
              <div className="field-row">
                <div className="field"><label className="field-label">LinkedIn</label><Input className={inputCls} type="url" value={data.seo.linkedin} onChange={e => set('seo', { linkedin: e.target.value })} /></div>
                <div className="field"><label className="field-label">Instagram</label><Input className={inputCls} value={data.seo.instagram} onChange={e => set('seo', { instagram: e.target.value })} /></div>
              </div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Analytics & Tracking</h2>
              <p className="section-desc">Third-party analytics scripts</p>
              <div className="field"><label className="field-label">Google Analytics Measurement ID</label><Input className={inputCls} value={data.seo.ga_id} onChange={e => set('seo', { ga_id: e.target.value })} placeholder="G-XXXXXXXXXX" /></div>
              <div className="field"><label className="field-label">Custom Head Script</label><textarea className={inputCls} style={{ fontFamily: 'monospace', fontSize: '0.78rem' }} value={data.seo.head_script} onChange={e => set('seo', { head_script: e.target.value })} placeholder="<!-- Paste tracking scripts here -->" /><span className="field-hint">Injected into &lt;head&gt; on all pages. Be careful with untrusted scripts.</span></div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Sitemap & Robots</h2>
              <p className="section-desc">Search engine crawling configuration</p>
              <div className="toggle-list">
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Auto-Generate Sitemap</div><div className="toggle-desc">Automatically update sitemap.xml when articles are published</div></div><Toggle checked={data.seo.auto_sitemap} onChange={v => set('seo', { auto_sitemap: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Index Published Articles</div><div className="toggle-desc">Allow search engines to index article pages</div></div><Toggle checked={data.seo.index_articles} onChange={v => set('seo', { index_articles: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Index Author Profiles</div><div className="toggle-desc">Allow search engines to index public author pages</div></div><Toggle checked={data.seo.index_authors} onChange={v => set('seo', { index_authors: v })} /></div>
              </div>
              <div className="field" style={{ marginTop: 16 }}><label className="field-label">robots.txt</label><div className="code-block">{data.seo.robots_txt}</div></div>
            </section>
          </div>
        )}

        {/* ADVANCED */}
        {activeTab === 'advanced' && (
          <div>
            <section className="section-card">
              <h2 className="section-title">Performance & Caching</h2>
              <p className="section-desc">Redis caching and CDN configuration</p>
              <div className="field"><label className="field-label">Redis URL</label><Input className={inputCls} type="password" value={data.advanced.redis_url} onChange={e => set('advanced', { redis_url: e.target.value })} /><span className="field-hint">Used for feed caching, pub/sub, and session storage</span></div>
              <div className="field-row">
                <div className="field"><label className="field-label">Feed Cache TTL</label><div className="inline-edit"><input type="number" className={inputCls} value={data.advanced.feed_cache_ttl} style={{ maxWidth: 80 }} onChange={e => set('advanced', { feed_cache_ttl: num(e.target.value) })} /><span className="inline-unit">seconds</span></div></div>
                <div className="field"><label className="field-label">Article Cache TTL</label><div className="inline-edit"><input type="number" className={inputCls} value={data.advanced.article_cache_ttl} style={{ maxWidth: 80 }} onChange={e => set('advanced', { article_cache_ttl: num(e.target.value) })} /><span className="inline-unit">seconds</span></div></div>
              </div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Security</h2>
              <p className="section-desc">Platform security settings</p>
              <div className="toggle-list">
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Rate Limiting</div><div className="toggle-desc">Limit API requests to prevent abuse (100 req/min per IP)</div></div><Toggle checked={data.advanced.rate_limiting} onChange={v => set('advanced', { rate_limiting: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">CORS Restriction</div><div className="toggle-desc">Only allow requests from configured origins</div></div><Toggle checked={data.advanced.cors_restriction} onChange={v => set('advanced', { cors_restriction: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Brute Force Protection</div><div className="toggle-desc">Lock account after 5 failed login attempts (30 min cooldown)</div></div><Toggle checked={data.advanced.brute_force} onChange={v => set('advanced', { brute_force: v })} /></div>
                <div className="toggle-row"><div className="toggle-info"><div className="toggle-name">Force HTTPS</div><div className="toggle-desc">Redirect all HTTP traffic to HTTPS</div></div><Toggle checked={data.advanced.force_https} onChange={v => set('advanced', { force_https: v })} /></div>
              </div>
              <div className="field" style={{ marginTop: 20 }}><label className="field-label">Allowed Origins (CORS)</label><textarea className={inputCls} style={{ fontFamily: 'monospace', fontSize: '0.78rem' }} rows={3} value={data.advanced.allowed_origins} onChange={e => set('advanced', { allowed_origins: e.target.value })} /></div>
            </section>

            <section className="section-card">
              <h2 className="section-title">Backups</h2>
              <p className="section-desc">Database and file backup configuration</p>
              <div className="field-row">
                <div className="field"><label className="field-label">Backup Frequency</label><select className={inputCls} value={data.advanced.backup_freq} onChange={e => set('advanced', { backup_freq: e.target.value })}><option>Every 6 hours</option><option>Daily</option><option>Weekly</option></select></div>
                <div className="field"><label className="field-label">Retention Period</label><select className={inputCls} value={data.advanced.backup_retention} onChange={e => set('advanced', { backup_retention: e.target.value })}><option>7 days</option><option>30 days</option><option>90 days</option></select></div>
              </div>
              <div className="alert alert-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                Last backup: Jul 12, 2026 at 2:00 AM EAT (1.2 GB)
              </div>
            </section>

            <section className="section-card danger-section">
              <h2 className="section-title" style={{ color: 'var(--error)' }}>Danger Zone</h2>
              <p className="section-desc">Irreversible actions that affect the entire platform</p>
              <div className="danger-actions">
                <Button variant="ghost" onClick={() => {}} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>Put Site in Maintenance Mode</Button>
                <Button variant="ghost" onClick={() => {}} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>Export All Data</Button>
                <Button variant="danger" onClick={() => {}}>Reset Platform to Defaults</Button>
              </div>
            </section>
          </div>
        )}
      </SettingsLayout>

      <div className="save-bar">
        <span className="save-bar-text"><span className="save-dot" />Unsaved changes</span>
        <Button variant="ghost" size="sm" onClick={() => load()}>Discard</Button>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </>
  )
}
