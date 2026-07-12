'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_USERS } from '@/lib/mock-data'

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!

const TABS = ['General', 'Security', 'Monetization', 'Notifications', 'Integrations']

const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all duration-300'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('General')
  const [saved, setSaved]         = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Topbar title="Settings" user={ADMIN} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Tab bar */}
        <div className="flex gap-1 backdrop-blur-sm rounded-2xl shadow-sm p-1 mb-6 overflow-x-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300"
              style={{
                padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500,
                ...(activeTab === tab
                  ? { background: 'var(--primary)', color: 'var(--text-inverse)', boxShadow: 'var(--shadow-sm)' }
                  : { background: 'transparent', color: 'var(--text-secondary)' })
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="backdrop-blur-sm rounded-2xl shadow-sm p-6 transition-all duration-300" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>

          {activeTab === 'General' && (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} />
                <h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>General Settings</h2>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="site-name" style={{ color: 'var(--text-primary)' }}>Site Name</label>
                <input id="site-name" type="text" defaultValue="026NEWS" className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="tagline" style={{ color: 'var(--text-primary)' }}>Tagline</label>
                <input id="tagline" type="text" defaultValue="Kenya's Premier Digital News Platform" className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="contact-email" style={{ color: 'var(--text-primary)' }}>Contact Email</label>
                <input id="contact-email" type="email" defaultValue="hello@026news.com" className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="app-url" style={{ color: 'var(--text-primary)' }}>App URL</label>
                <input id="app-url" type="url" defaultValue="https://026news.vercel.app" className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit"
                  className="font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                  Save Changes
                </button>
                {saved && (
                  <span className="text-sm font-semibold px-3 py-1.5 rounded-lg animate-fade-in" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>
                    ✓ Saved!
                  </span>
                )}
              </div>
            </form>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} />
                <h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>Security Settings</h2>
              </div>
              {[
                { label: 'Require email verification for new accounts', checked: true },
                { label: 'Enable two-factor authentication (2FA)', checked: false },
                { label: 'Rate limit API requests', checked: true },
                { label: 'Block VPN / Tor traffic', checked: false },
                { label: 'Enable Supabase Row Level Security (RLS)', checked: true },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked={item.checked}
                    className="w-4 h-4 rounded" style={{ accentColor: 'var(--primary)' }} />
                  <span className="text-sm group-hover:opacity-80 transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                </label>
              ))}
              <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Supabase Service Role Key</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Stored securely as environment variable. Never exposed to the client.</p>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Quick DB Skimmer</p>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/admin/skimmer')
                      if (!res.ok) throw new Error('skimmer failed')
                      const data = await res.json()
                      alert(`Users: ${data.users} — Articles: ${data.articles}`)
                    } catch {
                      alert('Failed to run skimmer')
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md"
                  style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}
                >
                  Run DB Skimmer
                </button>
                <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Admin-only quick check of user/article counts.</p>
              </div>
            </div>
          )}

          {activeTab === 'Monetization' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full" style={{ background: 'var(--warning)' }} />
                <h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>Monetization Settings</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Author Revenue Share (%)</label>
                  <input type="number" defaultValue={70} min={0} max={100} className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Minimum Payout Amount (USD)</label>
                  <input type="number" defaultValue={25} min={5} className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Google AdSense Publisher ID</label>
                <input type="text" placeholder="ca-pub-XXXXXXXXXXXXXXXX" className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Stripe Publishable Key</label>
                <input type="text" placeholder="pk_live_..." className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>M-Pesa Consumer Key</label>
                <input type="text" placeholder="M-Pesa API key" className={inputCls} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <button className="font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                Save Monetization Settings
              </button>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} />
                <h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>Notification Settings</h2>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Configure which events trigger admin notifications via email and in-app alerts.</p>
              {[
                { label: 'New article submitted for review', checked: true },
                { label: 'Article approved / rejected',     checked: true },
                { label: 'New author signup',           checked: true },
                { label: 'Comment flagged for moderation',  checked: true },
                { label: 'Payout request received',         checked: false },
                { label: 'Platform revenue milestone',      checked: false },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 rounded" style={{ accentColor: 'var(--primary)' }} />
                  <span className="text-sm group-hover:opacity-80 transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'Integrations' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full" style={{ background: 'var(--primary)' }} />
                <h2 className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>Third-Party Integrations</h2>
              </div>
              {[
                { name: 'Supabase',       desc: 'Database, Auth & Realtime',       status: 'connected',      icon: '🔷' },
                { name: 'Vercel',         desc: 'Deployment & Edge Functions',     status: 'connected',      icon: '▲' },
                { name: 'Google Analytics', desc: 'Traffic & conversion tracking', status: 'not configured', icon: '📊' },
                { name: 'Sentry',         desc: 'Error monitoring & alerting',     status: 'not configured', icon: '🛡️' },
                { name: 'Logflare',       desc: 'Log management (Supabase native)','status': 'not configured', icon: '📋' },
                { name: 'Perspective API', desc: 'AI comment moderation',          status: 'not configured', icon: '🤖' },
              ].map(integration => (
                <div key={integration.name} className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300"
                  style={{ border: '1px solid var(--border-subtle)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{integration.icon}</span>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{integration.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{integration.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      ...(integration.status === 'connected'
                        ? { background: 'var(--success-light)', color: 'var(--success)' }
                        : { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' })
                    }}>
                      {integration.status}
                    </span>
                    <button className="text-xs font-semibold transition-colors duration-300" style={{ color: 'var(--primary)' }}>
                      {integration.status === 'connected' ? 'Configure' : 'Connect'}
                    </button>
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
