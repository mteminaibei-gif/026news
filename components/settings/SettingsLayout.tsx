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
      <div className="settings-hero">
        <h1 className="settings-hero-title">{title}</h1>
        {description && (
          <p className="settings-hero-desc">{description}</p>
        )}
      </div>

      <div className="settings-grid" style={{ padding: '1.5rem 1rem 3rem' }}>
        <div className="settings-sidebar-wrap">
          <nav className="settings-glass-sidebar">
            <div className="settings-sidebar-scroll">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {tabs.map(tab => {
                const isActive = tab.id === activeTab
                const Icon = tab.icon

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className="settings-tab-btn"
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
                      position: 'relative',
                      minHeight: 44,
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3,
                          height: '60%',
                          borderRadius: 3,
                          background: 'var(--grad-primary)',
                          boxShadow: 'var(--glow-primary)',
                        }}
                      />
                    )}
                    {Icon && <Icon size={16} />}
                    {tab.label}
                  </button>
                )
              })}
            </div>
            </div>
          </nav>
        </div>

        <div className="settings-content">{children}</div>
      </div>
    </div>
  )
}
