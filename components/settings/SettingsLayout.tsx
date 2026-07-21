'use client'

import { ReactNode } from 'react'
import { TabNav } from '@/components/ui/TabNav'
import { Card } from '@/components/ui/Card'

export interface SettingsTab {
  id: string
  label: string
  icon?: React.ComponentType<{ size?: number }>
}

interface SettingsLayoutProps {
  tabs: SettingsTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: ReactNode
  title?: string
  description?: string
}

export function SettingsLayout({
  tabs,
  activeTab,
  onTabChange,
  children,
  title = 'Settings',
  description,
}: SettingsLayoutProps) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Modern Header */}
      <div className="settings-hero">
        <h1 className="settings-hero-title">{title}</h1>
        {description && (
          <p className="settings-hero-desc">{description}</p>
        )}
      </div>

      {/* Settings Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem', padding: '1.5rem 1rem 3rem' }}>
        {/* Glass Sidebar Tabs */}
        <div style={{ position: 'sticky', top: 84, alignSelf: 'start' }}>
          <nav className="settings-glass-sidebar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {tabs.map(tab => {
                const isActive = tab.id === activeTab
                const Icon = tab.icon

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.7rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--primary-light)' : 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s var(--ease-out-expo)',
                      textAlign: 'left',
                    }}
                  >
                    {Icon && <Icon size={16} />}
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  )
}
