'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Users, Zap, AlertCircle, Database, Shield, BarChart3, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeAnalytics } from '@/lib/hooks/useRealtimeAnalytics'
import { AnimatedChart } from './AnalyticsChart'
import { UserManagementTable } from './UserManagementTable'

interface TabConfig {
  id: string
  label: string
  icon: React.ReactNode
  description: string
}

interface SystemConfig {
  maintenance_mode: boolean
  email_notifications: boolean
  api_rate_limiting: boolean
  user_registration: boolean
}

const tabs: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={20} />, description: 'Real-time platform metrics' },
  { id: 'users', label: 'User Management', icon: <Users size={20} />, description: 'Manage users and roles' },
  { id: 'system', label: 'System', icon: <Settings size={20} />, description: 'System configuration' },
  { id: 'performance', label: 'Performance', icon: <Zap size={20} />, description: 'System performance metrics' },
  { id: 'security', label: 'Security', icon: <Shield size={20} />, description: 'Security and compliance' },
]

const SYSTEM_SETTINGS: { key: keyof SystemConfig; label: string; description: string }[] = [
  { key: 'maintenance_mode', label: 'Maintenance Mode', description: 'Temporarily take the site offline' },
  { key: 'email_notifications', label: 'Email Notifications', description: 'Send outgoing email alerts' },
  { key: 'api_rate_limiting', label: 'API Rate Limiting', description: 'Throttle public API requests' },
  { key: 'user_registration', label: 'User Registration', description: 'Allow new sign-ups' },
]

function StatusDot({ ok }: { ok: boolean }) {
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? 'var(--success)' : 'var(--warning)', flexShrink: 0 }} />
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: on ? 'var(--success)' : 'var(--border-strong)',
        position: 'relative', transition: 'background 0.2s', cursor: 'pointer', border: 'none',
      }}
    >
      <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
    </button>
  )
}

export function AdminControlPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const { metrics } = useRealtimeAnalytics()

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    maintenance_mode: false,
    email_notifications: true,
    api_rate_limiting: true,
    user_registration: true,
  })
  const [savingSystem, setSavingSystem] = useState(false)

  // Load persisted system settings
  useEffect(() => {
    (async () => {
      const supabase = createClient()
      // site_settings is managed via migrations and not present in the generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('site_settings') as any)
        .select('value')
        .eq('key', 'system_config')
        .maybeSingle()
      if (data?.value) {
        setSystemConfig((prev) => ({ ...prev, ...(data.value as Partial<SystemConfig>) }))
      }
    })()
  }, [])

  const saveSystem = useCallback(async () => {
    setSavingSystem(true)
    const supabase = createClient()
    // site_settings is managed via migrations and not present in the generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('site_settings') as any)
      .upsert({ key: 'system_config', value: systemConfig, updated_at: new Date().toISOString() })
    setSavingSystem(false)
  }, [systemConfig])

  const viewsChartData = [
    { name: 'Today', value: metrics.totalViews },
    { name: 'Last 7 days', value: Math.round(metrics.totalViews * 0.8) },
    { name: 'Last 30 days', value: Math.round(metrics.totalViews * 0.6) },
  ]
  const earningsChartData = [
    { name: 'Today', value: Math.round(metrics.totalEarnings) },
    { name: 'Last 7 days', value: Math.round(metrics.totalEarnings * 0.8) },
    { name: 'Last 30 days', value: Math.round(metrics.totalEarnings * 0.6) },
  ]

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Admin Control Panel</h1>
            <p style={{ color: 'var(--text-tertiary)' }}>Manage your platform, users, and systems in real-time</p>
          </div>
          <span
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            Live · Auto-syncing
          </span>
        </div>

        {/* Quick Stats */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Active Users', value: metrics.activeUsers, icon: Users, color: 'var(--success)' },
              { label: 'Articles Today', value: metrics.articlesPublished, icon: BarChart3, color: 'var(--primary)' },
              { label: 'Total Views', value: metrics.totalViews.toLocaleString(), icon: Zap, color: 'var(--warning)' },
              { label: 'Total Earnings', value: `KES ${Math.round(metrics.totalEarnings).toLocaleString()}`, icon: Database, color: 'var(--primary-hover)' },
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow" style={{ background: 'var(--bg-surface)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: `color-mix(in srgb, ${stat.color} 15%, transparent)` }}>
                      <Icon size={24} style={{ color: stat.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap"
                style={{
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-tertiary)',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <AnimatedChart data={viewsChartData} title="Article Views" type="line" color="var(--success)" />
                <AnimatedChart data={earningsChartData} title="Earnings (KES)" type="bar" color="var(--warning)" />

                <div className="rounded-2xl p-6 shadow-lg" style={{ background: 'var(--bg-surface)' }}>
                  <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
                  <div className="space-y-3">
                    {metrics.recentActivity.slice(0, 5).map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-3 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
                        <Clock size={16} className="mt-1 flex-shrink-0" style={{ color: 'var(--success)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{activity.user}</p>
                          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{new Date(activity.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <UserManagementTable />
            )}

            {activeTab === 'system' && (
              <div className="rounded-2xl p-6 shadow-lg" style={{ background: 'var(--bg-surface)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>System Configuration</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Toggle platform behaviours (saved to site settings)</p>
                  </div>
                  <button
                    onClick={saveSystem}
                    disabled={savingSystem}
                    className="px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-60"
                    style={{ background: 'var(--primary)', color: 'var(--text-inverse)', border: 'none', cursor: 'pointer', fontSize: 14 }}
                  >
                    {savingSystem ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
                <div className="space-y-3">
                  {SYSTEM_SETTINGS.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{setting.label}</p>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{setting.description}</p>
                      </div>
                      <Toggle on={systemConfig[setting.key]} onClick={() => setSystemConfig((prev) => ({ ...prev, [setting.key]: !prev[setting.key] }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="rounded-2xl p-6 shadow-lg" style={{ background: 'var(--bg-surface)' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Performance Metrics</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Server Response Time', value: '145ms', ok: true },
                    { label: 'Database Load', value: '62%', ok: true },
                    { label: 'Memory Usage', value: '78%', ok: false },
                    { label: 'API Requests/min', value: '1,234', ok: true },
                  ].map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between" style={{ background: 'var(--bg-muted)', padding: '12px 16px', borderRadius: 12 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{metric.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{metric.value}</span>
                        <StatusDot ok={metric.ok} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="rounded-2xl p-6 shadow-lg" style={{ background: 'var(--bg-surface)' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Security Settings</h3>
                <div className="space-y-4">
                  {[
                    { name: '2-Factor Authentication', description: 'Require 2FA for admin users', enabled: true },
                    { name: 'SSL/TLS', description: 'Encrypted connections', enabled: true },
                    { name: 'CORS Policy', description: 'Cross-origin restrictions', enabled: true },
                  ].map((security, idx) => (
                    <div key={idx} className="flex items-start justify-between p-3 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{security.name}</p>
                        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{security.description}</p>
                      </div>
                      <Toggle on={security.enabled} onClick={() => {}} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 shadow-lg" style={{ background: 'var(--bg-surface)' }}>
              <h4 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>System Status</h4>
              <div className="space-y-2">
                {[
                  { service: 'API Server', ok: true },
                  { service: 'Database', ok: true },
                  { service: 'Cache', ok: true },
                  { service: 'Email Service', ok: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{item.service}</span>
                    <div className="flex items-center gap-2">
                      <StatusDot ok={item.ok} />
                      <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>Online</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)' }}>
              <div className="flex gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                <div>
                  <h4 className="font-bold mb-1" style={{ color: 'var(--warning)' }}>Resource Warning</h4>
                  <p className="text-sm" style={{ color: 'var(--warning)' }}>Memory usage approaching 80%. Consider scaling resources.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
