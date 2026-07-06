'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_USERS } from '@/lib/mock-data'

const ADMIN = MOCK_USERS.find(u => u.role === 'admin')!

const TABS = ['General', 'Security', 'Monetization', 'Notifications', 'Integrations']

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('General')
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="Settings" user={ADMIN} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Tab bar */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-[#0a1628] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === 'General' && (
            <form onSubmit={handleSave} className="space-y-5">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4">General Settings</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="site-name">Site Name</label>
                <input id="site-name" type="text" defaultValue="026News" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="tagline">Tagline</label>
                <input id="tagline" type="text" defaultValue="Breaking News, Freelance Journalism & Analysis" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="contact-email">Contact Email</label>
                <input id="contact-email" type="email" defaultValue="hello@026news.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="app-url">App URL</label>
                <input id="app-url" type="url" defaultValue="https://026news.vercel.app" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">
                  Save Changes
                </button>
                {saved && <span className="text-sm text-green-600 font-semibold">✓ Saved!</span>}
              </div>
            </form>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-5">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4">Security Settings</h2>
              {[
                { label: 'Require email verification for new accounts', checked: true },
                { label: 'Enable two-factor authentication (2FA)', checked: false },
                { label: 'Rate limit API requests', checked: true },
                { label: 'Block VPN / Tor traffic', checked: false },
                { label: 'Enable Supabase Row Level Security (RLS)', checked: true },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 rounded accent-orange-500" />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-semibold">Supabase Service Role Key</p>
                <p className="text-xs text-blue-500 mt-1">Stored securely as environment variable. Never exposed to the client.</p>
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
                    } catch (e) {
                      alert('Failed to run skimmer')
                    }
                  }}
                  className="bg-[#0a1628] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Run DB Skimmer
                </button>
                <p className="text-xs text-gray-500 mt-2">Admin-only quick check of user/article counts.</p>
              </div>
            </div>
          )}

          {activeTab === 'Monetization' && (
            <div className="space-y-5">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4">Monetization Settings</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Journalist Revenue Share (%)</label>
                  <input type="number" defaultValue={70} min={0} max={100} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Minimum Payout Amount (USD)</label>
                  <input type="number" defaultValue={25} min={5} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google AdSense Publisher ID</label>
                <input type="text" placeholder="ca-pub-XXXXXXXXXXXXXXXX" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stripe Publishable Key</label>
                <input type="text" placeholder="pk_live_..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">M-Pesa Consumer Key</label>
                <input type="text" placeholder="M-Pesa API key" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">
                Save Monetization Settings
              </button>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-5">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4">Notification Settings</h2>
              <p className="text-sm text-gray-500">Configure which events trigger admin notifications via email and in-app alerts.</p>
              {[
                { label: 'New article submitted for review', checked: true },
                { label: 'Article approved / rejected', checked: true },
                { label: 'New journalist signup', checked: true },
                { label: 'Comment flagged for moderation', checked: true },
                { label: 'Payout request received', checked: false },
                { label: 'Platform revenue milestone', checked: false },
              ].map(item => (
                <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 rounded accent-orange-500" />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          )}

          {activeTab === 'Integrations' && (
            <div className="space-y-5">
              <h2 className="text-lg font-extrabold text-gray-900 mb-4">Third-Party Integrations</h2>
              {[
                { name: 'Supabase', desc: 'Database, Auth & Realtime', status: 'connected', icon: '🔷' },
                { name: 'Vercel', desc: 'Deployment & Edge Functions', status: 'connected', icon: '▲' },
                { name: 'Google Analytics', desc: 'Traffic & conversion tracking', status: 'not configured', icon: '📊' },
                { name: 'Sentry', desc: 'Error monitoring & alerting', status: 'not configured', icon: '🛡️' },
                { name: 'Logflare', desc: 'Log management (Supabase native)', status: 'not configured', icon: '📋' },
                { name: 'Perspective API', desc: 'AI comment moderation', status: 'not configured', icon: '🤖' },
              ].map(integration => (
                <div key={integration.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{integration.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{integration.name}</p>
                      <p className="text-xs text-gray-500">{integration.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      integration.status === 'connected'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {integration.status}
                    </span>
                    <button className="text-xs font-semibold text-blue-600 hover:underline">
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
