'use client'

import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'

const TABS = ['General', 'RSS & Publishing', 'Monetization', 'Notifications', 'Security', 'Integrations']

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all duration-300'

type General = { site_name: string; tagline: string; contact_email: string; app_url: string }
type Monetization = { revenue_share: number; min_payout: number; adsense_publisher_id: string; stripe_publishable_key: string; mpesa_consumer_key: string }
type AdminNotifs = Record<string, boolean>
type Security = Record<string, boolean>
type Publishing = { rss_auto_publish: boolean; rss_max_per_fetch: number; inhouse_publish_limit: number }

const DEFAULTS = {
  general: { site_name: '026NEWS', tagline: "Kenya's Premier Digital News Platform", contact_email: 'hello@026news.com', app_url: 'https://026news.vercel.app' } as General,
  monetization: { revenue_share: 70, min_payout: 25, adsense_publisher_id: '', stripe_publishable_key: '', mpesa_consumer_key: '' } as Monetization,
  admin_notifications: { new_submission: true, article_decision: true, new_user: true, flagged_comment: true, payout_request: false, revenue_milestone: false } as AdminNotifs,
  security: { email_verification: true, two_factor: false, rate_limiting: true, block_vpn: false, rls_enabled: true } as Security,
  publishing_config: { rss_auto_publish: true, rss_max_per_fetch: 20, inhouse_publish_limit: 30 } as Publishing,
}

const ADMIN_NOTIF_ITEMS = [
  { key: 'new_submission', label: 'New article submitted for review' },
  { key: 'article_decision', label: 'Article approved / rejected' },
  { key: 'new_user', label: 'New author signup' },
  { key: 'flagged_comment', label: 'Comment flagged for moderation' },
  { key: 'payout_request', label: 'Payout request received' },
  { key: 'revenue_milestone', label: 'Platform revenue milestone' },
]

const SECURITY_ITEMS = [
  { key: 'email_verification', label: 'Require email verification for new accounts' },
  { key: 'two_factor', label: 'Enable two-factor authentication (2FA)' },
  { key: 'rate_limiting', label: 'Rate limit API requests' },
  { key: 'block_vpn', label: 'Block VPN / Tor traffic' },
  { key: 'rls_enabled', label: 'Enable Supabase Row Level Security (RLS)' },
]

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('General')
  const [loading, setLoading] = useState(true)
  const [savedTab, setSavedTab] = useState('')
  const [admin, setAdmin] = useState<{ name: string; profile_image: string | null } | null>(null)

  const [general, setGeneral] = useState<General>(DEFAULTS.general)
  const [monetization, setMonetization] = useState<Monetization>(DEFAULTS.monetization)
  const [adminNotifs, setAdminNotifs] = useState<AdminNotifs>(DEFAULTS.admin_notifications)
  const [security, setSecurity] = useState<Security>(DEFAULTS.security)
  const [publishing, setPublishing] = useState<Publishing>(DEFAULTS.publishing_config)

  const load = useCallback(async () => {
    const supabase = createClient()

    // Load admin user info
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: adminData } = await supabase
        .from('users').select('name, profile_image').eq('email', user.email ?? '').single() as { data: { name: string; profile_image: string | null } | null }
      if (adminData) {
        setAdmin({ name: adminData.name, profile_image: adminData.profile_image })
      } else {
        setAdmin({ name: user.email?.split('@')[0] || 'Admin', profile_image: null })
      }
    }

    // Load settings
    const { data } = await (supabase.from('site_settings') as any)
      .select('key, value')
    if (data) {
      const map: Record<string, any> = {}
      data.forEach((r: { key: string; value: any }) => (map[r.key] = r.value))
      if (map.general) setGeneral({ ...DEFAULTS.general, ...map.general })
      if (map.monetization) setMonetization({ ...DEFAULTS.monetization, ...map.monetization })
      if (map.admin_notifications) setAdminNotifs({ ...DEFAULTS.admin_notifications, ...map.admin_notifications })
      if (map.security) setSecurity({ ...DEFAULTS.security, ...map.security })
      if (map.publishing_config) setPublishing({ ...DEFAULTS.publishing_config, ...map.publishing_config })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (key: string, value: unknown) => {
    const supabase = createClient()
    const { error } = await (supabase.from('site_settings') as any)
      .upsert({ key, value, updated_at: new Date().toISOString() })
    if (!error) {
      setSavedTab(key)
      setTimeout(() => setSavedTab(''), 2500)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
        <Topbar title="Settings" user={{ name: 'Admin', profile_image: null }} />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8" style={{ color: 'var(--text-tertiary)' }}>Loading settings…</main>
      </div>
    )
  }

  const panel = 'backdrop-blur-sm rounded-2xl shadow-sm p-6 transition-all duration-300'
  const panelStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }
  const field = (id: string, label: string, value: string, onChange: (v: string) => void, type = 'text') => (
    <div>
      <label className="block text-sm font-semibold mb-1.5" htmlFor={id} style={{ color: 'var(--text-primary)' }}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
    </div>
  )
  const SaveBtn = ({ tab }: { tab: string }) => (
    <div className="flex items-center gap-3 pt-2">
      <button type="button" onClick={() => save(tab, tab === 'general' ? general : tab === 'monetization' ? monetization : tab === 'admin_notifications' ? adminNotifs : tab === 'security' ? security : publishing)} className="font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5" style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>Save Changes</button>
      {savedTab === tab && <span className="text-sm font-semibold px-3 py-1.5 rounded-lg animate-fade-in" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>✓ Saved!</span>}
    </div>
  )
  const ToggleRow = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onToggle} className="w-4 h-4 rounded" style={{ accentColor: 'var(--primary)' }} />
      <span className="text-sm group-hover:opacity-80 transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>{label}</span>
    </label>
  )

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Topbar title="Settings" user={admin ?? { name: 'Admin', profile_image: null }} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="flex gap-1 backdrop-blur-sm rounded-2xl shadow-sm p-1 mb-6 overflow-x-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300" style={{ padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500, ...(activeTab === tab ? { background: 'var(--primary)', color: 'var(--text-inverse)', boxShadow: 'var(--shadow-sm)' } : { background: 'transparent', color: 'var(--text-secondary)' }) }}>
              {tab}
            </button>
          ))}
        </div>

        <div className={panel} style={panelStyle}>
          {activeTab === 'General' && (
            <form onSubmit={(e) => { e.preventDefault(); save('general', general) }} className="space-y-5">
              <div className="flex items-center gap-2 mb-4"><span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} /><h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>General Settings</h2></div>
              {field('site-name', 'Site Name', general.site_name, (v) => setGeneral((s) => ({ ...s, site_name: v })))}
              {field('tagline', 'Tagline', general.tagline, (v) => setGeneral((s) => ({ ...s, tagline: v })))}
              {field('contact-email', 'Contact Email', general.contact_email, (v) => setGeneral((s) => ({ ...s, contact_email: v })), 'email')}
              {field('app-url', 'App URL', general.app_url, (v) => setGeneral((s) => ({ ...s, app_url: v })), 'url')}
              <SaveBtn tab="general" />
            </form>
          )}

          {activeTab === 'RSS & Publishing' && (
            <form onSubmit={(e) => { e.preventDefault(); save('publishing_config', publishing) }} className="space-y-5">
              <div className="flex items-center gap-2 mb-4"><span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} /><h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>RSS &amp; Publishing Limits</h2></div>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Control how many articles RSS feeds may publish and how many a journalist can publish in-house per 30 days.</p>
              <ToggleRow label="Enable RSS auto-publishing" checked={publishing.rss_auto_publish} onToggle={() => setPublishing((s) => ({ ...s, rss_auto_publish: !s.rss_auto_publish }))} />
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="rss-max" style={{ color: 'var(--text-primary)' }}>Max RSS articles per fetch</label>
                <input id="rss-max" type="number" min={1} value={publishing.rss_max_per_fetch} onChange={(e) => setPublishing((s) => ({ ...s, rss_max_per_fetch: Number(e.target.value) || 0 }))} className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="inhouse-limit" style={{ color: 'var(--text-primary)' }}>In-house publish limit (per journalist / 30 days)</label>
                <input id="inhouse-limit" type="number" min={0} value={publishing.inhouse_publish_limit} onChange={(e) => setPublishing((s) => ({ ...s, inhouse_publish_limit: Number(e.target.value) || 0 }))} className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <SaveBtn tab="publishing_config" />
            </form>
          )}

          {activeTab === 'Monetization' && (
            <form onSubmit={(e) => { e.preventDefault(); save('monetization', monetization) }} className="space-y-5">
              <div className="flex items-center gap-2 mb-4"><span className="w-1 h-5 rounded-full" style={{ background: 'var(--warning)' }} /><h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>Monetization Settings</h2></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Author Revenue Share (%)</label><input type="number" min={0} max={100} value={monetization.revenue_share} onChange={(e) => setMonetization((s) => ({ ...s, revenue_share: Number(e.target.value) || 0 }))} className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} /></div>
                <div><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Minimum Payout Amount (USD)</label><input type="number" min={5} value={monetization.min_payout} onChange={(e) => setMonetization((s) => ({ ...s, min_payout: Number(e.target.value) || 0 }))} className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} /></div>
              </div>
              {field('adsense', 'Google AdSense Publisher ID', monetization.adsense_publisher_id, (v) => setMonetization((s) => ({ ...s, adsense_publisher_id: v })))}
              {field('stripe', 'Stripe Publishable Key', monetization.stripe_publishable_key, (v) => setMonetization((s) => ({ ...s, stripe_publishable_key: v })))}
              {field('mpesa', 'M-Pesa Consumer Key', monetization.mpesa_consumer_key, (v) => setMonetization((s) => ({ ...s, mpesa_consumer_key: v })))}
              <SaveBtn tab="monetization" />
            </form>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4"><span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} /><h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>Notification Settings</h2></div>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Configure which events trigger admin notifications via email and in-app alerts.</p>
              <div className="space-y-3">
                {ADMIN_NOTIF_ITEMS.map((item) => (
                  <ToggleRow key={item.key} label={item.label} checked={!!adminNotifs[item.key]} onToggle={() => { setAdminNotifs((s) => ({ ...s, [item.key]: !s[item.key] })); }} />
                ))}
              </div>
              <SaveBtn tab="admin_notifications" />
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4"><span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} /><h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>Security Settings</h2></div>
              <div className="space-y-3">
                {SECURITY_ITEMS.map((item) => (
                  <ToggleRow key={item.key} label={item.label} checked={!!security[item.key]} onToggle={() => { setSecurity((s) => ({ ...s, [item.key]: !s[item.key] })); }} />
                ))}
              </div>
              <SaveBtn tab="security" />
            </div>
          )}

          {activeTab === 'Integrations' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4"><span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} /><h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>Third-Party Integrations</h2></div>
              {[
                { name: 'Supabase', desc: 'Database, Auth & Realtime', status: 'connected', icon: '🔷' },
                { name: 'Vercel', desc: 'Deployment & Edge Functions', status: 'connected', icon: '▲' },
                { name: 'Google Analytics', desc: 'Traffic & conversion tracking', status: 'not configured', icon: '📊' },
                { name: 'Sentry', desc: 'Error monitoring & alerting', status: 'not configured', icon: '🛡️' },
                { name: 'Logflare', desc: 'Log management (Supabase native)', status: 'not configured', icon: '📋' },
                { name: 'Perspective API', desc: 'AI comment moderation', status: 'not configured', icon: '🤖' },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300" style={{ border: '1px solid var(--border-subtle)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{integration.icon}</span>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{integration.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{integration.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...(integration.status === 'connected' ? { background: 'var(--success-light)', color: 'var(--success)' } : { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }) }}>{integration.status}</span>
                    <button className="text-xs font-semibold transition-colors duration-300" style={{ color: 'var(--primary)' }}>{integration.status === 'connected' ? 'Configure' : 'Connect'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
