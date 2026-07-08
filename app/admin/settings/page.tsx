'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_USERS } from '@/lib/mock-data'

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!

const TABS = ['General', 'Security', 'Monetization', 'Notifications', 'Integrations']

const inputCls = 'w-full border border-[#e8f5ea] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4caf28] focus:ring-2 focus:ring-[#4caf28]/20 transition-all duration-300'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('General')
  const [saved, setSaved]         = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title="Settings" user={ADMIN} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Tab bar */}
        <div className="flex gap-1 bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-[#1a5c2a] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-[#f0faf2] hover:text-[#1a5c2a]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-6 transition-all duration-300">

          {activeTab === 'General' && (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-[#1a5c2a]" />
                <h2 className="text-lg font-extrabold text-[#1a5c2a]">General Settings</h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="site-name">Site Name</label>
                <input id="site-name" type="text" defaultValue="026NEWS" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="tagline">Tagline</label>
                <input id="tagline" type="text" defaultValue="Kenya's Premier Digital News Platform" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="contact-email">Contact Email</label>
                <input id="contact-email" type="email" defaultValue="hello@026news.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="app-url">App URL</label>
                <input id="app-url" type="url" defaultValue="https://026news.vercel.app" className={inputCls} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit"
                  className="bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  Save Changes
                </button>
                {saved && (
                  <span className="text-sm text-[#1a5c2a] font-semibold bg-[#e8f5ea] px-3 py-1.5 rounded-lg animate-fade-in">
                    ✓ Saved!
                  </span>
                )}
              </div>
            </form>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-[#1a5c2a]" />
                <h2 className="text-lg font-extrabold text-[#1a5c2a]">Security Settings</h2>
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
                    className="w-4 h-4 rounded accent-[#1a5c2a]" />
                  <span className="text-sm text-gray-700 group-hover:text-[#1a5c2a] transition-colors duration-300">{item.label}</span>
                </label>
              ))}
              <div className="mt-6 p-4 bg-[#f0faf2] rounded-xl border border-[#e8f5ea]">
                <p className="text-sm text-[#1a5c2a] font-semibold">Supabase Service Role Key</p>
                <p className="text-xs text-[#1a5c2a]/60 mt-1">Stored securely as environment variable. Never exposed to the client.</p>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Quick DB Skimmer</p>
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
                  className="bg-[#1a5c2a] hover:bg-[#2d8a47] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md"
                >
                  Run DB Skimmer
                </button>
                <p className="text-xs text-gray-500 mt-2">Admin-only quick check of user/article counts.</p>
              </div>
            </div>
          )}

          {activeTab === 'Monetization' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-[#f5c518]" />
                <h2 className="text-lg font-extrabold text-[#1a5c2a]">Monetization Settings</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Journalist Revenue Share (%)</label>
                  <input type="number" defaultValue={70} min={0} max={100} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Minimum Payout Amount (USD)</label>
                  <input type="number" defaultValue={25} min={5} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google AdSense Publisher ID</label>
                <input type="text" placeholder="ca-pub-XXXXXXXXXXXXXXXX" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stripe Publishable Key</label>
                <input type="text" placeholder="pk_live_..." className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">M-Pesa Consumer Key</label>
                <input type="text" placeholder="M-Pesa API key" className={inputCls} />
              </div>
              <button className="bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                Save Monetization Settings
              </button>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-[#1a5c2a]" />
                <h2 className="text-lg font-extrabold text-[#1a5c2a]">Notification Settings</h2>
              </div>
              <p className="text-sm text-gray-500">Configure which events trigger admin notifications via email and in-app alerts.</p>
              {[
                { label: 'New article submitted for review', checked: true },
                { label: 'Article approved / rejected',     checked: true },
                { label: 'New journalist signup',           checked: true },
                { label: 'Comment flagged for moderation',  checked: true },
                { label: 'Payout request received',         checked: false },
                { label: 'Platform revenue milestone',      checked: false },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 rounded accent-[#1a5c2a]" />
                  <span className="text-sm text-gray-700 group-hover:text-[#1a5c2a] transition-colors duration-300">{item.label}</span>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'Integrations' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-[#1a5c2a]" />
                <h2 className="text-lg font-extrabold text-[#1a5c2a]">Third-Party Integrations</h2>
              </div>
              {[
                { name: 'Supabase',       desc: 'Database, Auth & Realtime',       status: 'connected',      icon: '🔷' },
                { name: 'Vercel',         desc: 'Deployment & Edge Functions',     status: 'connected',      icon: '▲' },
                { name: 'Google Analytics', desc: 'Traffic & conversion tracking', status: 'not configured', icon: '📊' },
                { name: 'Sentry',         desc: 'Error monitoring & alerting',     status: 'not configured', icon: '🛡️' },
                { name: 'Logflare',       desc: 'Log management (Supabase native)','status': 'not configured', icon: '📋' },
                { name: 'Perspective API', desc: 'AI comment moderation',          status: 'not configured', icon: '🤖' },
              ].map(integration => (
                <div key={integration.name} className="flex items-center justify-between p-4 border border-[#e8f5ea] rounded-2xl hover:bg-[#f9fdf9] transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{integration.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{integration.name}</p>
                      <p className="text-xs text-gray-500">{integration.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      integration.status === 'connected'
                        ? 'bg-[#e8f5ea] text-[#1a5c2a]'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {integration.status}
                    </span>
                    <button className="text-xs font-semibold text-[#1a5c2a] hover:text-[#2d8a47] transition-colors duration-300">
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
