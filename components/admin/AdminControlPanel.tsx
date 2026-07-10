'use client'

import { useState } from 'react'
import { Settings, Users, Zap, AlertCircle, Database, Shield, BarChart3, Clock, Plus, X } from 'lucide-react'
import { useRealtimeAnalytics } from '@/lib/hooks/useRealtimeAnalytics'
import { AnimatedChart } from './AnalyticsChart'
import { AccountCreationForm } from './AccountCreationForm'

interface TabConfig {
  id: string
  label: string
  icon: React.ReactNode
  description: string
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <BarChart3 size={20} />,
    description: 'Real-time platform metrics',
  },
  {
    id: 'users',
    label: 'User Management',
    icon: <Users size={20} />,
    description: 'Manage users and roles',
  },
  {
    id: 'system',
    label: 'System',
    icon: <Settings size={20} />,
    description: 'System configuration',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: <Zap size={20} />,
    description: 'System performance metrics',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield size={20} />,
    description: 'Security and compliance',
  },
]

export function AdminControlPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [createdUsers, setCreatedUsers] = useState<any[]>([])
  const { metrics, loading } = useRealtimeAnalytics()

  // Format metrics for charts
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Control Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your platform, users, and systems in real-time
          </p>
        </div>

        {/* Quick Stats */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                label: 'Active Users',
                value: metrics.activeUsers,
                icon: Users,
                color: '#4caf28',
              },
              {
                label: 'Articles Today',
                value: metrics.articlesPublished,
                icon: BarChart3,
                color: '#2196f3',
              },
              {
                label: 'Total Views',
                value: metrics.totalViews.toLocaleString(),
                icon: Zap,
                color: '#ff9800',
              },
              {
                label: 'Total Earnings',
                value: `KES ${Math.round(metrics.totalEarnings).toLocaleString()}`,
                icon: Database,
                color: '#9c27b0',
              },
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <Icon size={24} style={{ color: stat.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
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
                <AnimatedChart
                  data={viewsChartData}
                  title="Article Views"
                  type="line"
                  color="#4caf28"
                />
                <AnimatedChart
                  data={earningsChartData}
                  title="Earnings (KES)"
                  type="bar"
                  color="#ff9800"
                />

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {metrics.recentActivity.slice(0, 5).map((activity, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                      >
                        <Clock size={16} className="text-green-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {activity.user}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      User Management
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Manage user accounts, roles, and permissions
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateAccount(!showCreateAccount)}
                    className="flex items-center gap-2 bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold px-4 py-2 rounded-lg transition-all"
                  >
                    <Plus size={18} />
                    Create Account
                  </button>
                </div>

                {/* Account Creation Form (Collapsible) */}
                {showCreateAccount && (
                  <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900 dark:text-white">Create New Account</h4>
                      <button
                        onClick={() => setShowCreateAccount(false)}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <AccountCreationForm
                      onSuccess={(user) => {
                        setCreatedUsers([user, ...createdUsers])
                        setShowCreateAccount(false)
                      }}
                      onClose={() => setShowCreateAccount(false)}
                    />
                  </div>
                )}

                {/* Recently Created Users */}
                {createdUsers.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                      ✓ Recently Created Accounts ({createdUsers.length})
                    </h4>
                    <div className="space-y-2">
                      {createdUsers.map((user, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">{user.name}</p>
                            <p className="text-xs text-green-800 dark:text-green-200">{user.email}</p>
                          </div>
                          <span className="inline-block bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 px-3 py-1 rounded-full text-xs font-medium">
                            {user.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Management Actions */}
                <div className="space-y-3">
                  {[
                    { action: 'Suspend user', description: 'Temporarily disable account' },
                    { action: 'Change role', description: 'Update user role/permissions' },
                    { action: 'Reset password', description: 'Force password reset' },
                    { action: 'Merge accounts', description: 'Combine duplicate accounts' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  System Configuration
                </h3>
                <div className="space-y-4">
                  {[
                    { name: 'Maintenance Mode', status: false },
                    { name: 'Email Notifications', status: true },
                    { name: 'API Rate Limiting', status: true },
                    { name: 'User Registration', status: true },
                  ].map((setting, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{setting.name}</span>
                      <div
                        className={`w-12 h-6 rounded-full transition-colors ${
                          setting.status ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Performance Metrics
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Server Response Time', value: '145ms', status: 'good' },
                    { label: 'Database Load', value: '62%', status: 'good' },
                    { label: 'Memory Usage', value: '78%', status: 'warning' },
                    { label: 'API Requests/min', value: '1,234', status: 'good' },
                  ].map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{metric.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{metric.value}</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            metric.status === 'good' ? 'bg-green-600' : 'bg-yellow-600'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Security Settings
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      name: '2-Factor Authentication',
                      description: 'Require 2FA for admin users',
                      enabled: true,
                    },
                    {
                      name: 'SSL/TLS',
                      description: 'Encrypted connections',
                      enabled: true,
                    },
                    {
                      name: 'CORS Policy',
                      description: 'Cross-origin restrictions',
                      enabled: true,
                    },
                  ].map((security, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{security.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {security.description}
                        </p>
                      </div>
                      <div
                        className={`w-12 h-6 rounded-full transition-colors ${
                          security.enabled ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* System Status */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">System Status</h4>
              <div className="space-y-2">
                {[
                  { service: 'API Server', status: 'online' },
                  { service: 'Database', status: 'online' },
                  { service: 'Cache', status: 'online' },
                  { service: 'Email Service', status: 'online' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.service}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600" />
                      <span className="text-xs font-medium text-green-600">Online</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
              <div className="flex gap-3">
                <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-1">
                    Resource Warning
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Memory usage approaching 80%. Consider scaling resources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
