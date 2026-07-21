'use client'

import { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ComponentType<{ size?: number }>
}

interface TabNavProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'default' | 'pills'
}

export function TabNav({ tabs, activeTab, onTabChange, variant = 'default' }: TabNavProps) {
  const isPills = variant === 'pills'

  return (
    <div
      style={{
        display: 'flex',
        gap: isPills ? '0.5rem' : '0',
        borderBottom: isPills ? 'none' : '1px solid var(--border)',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
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
              gap: '0.5rem',
              padding: isPills ? '0.5rem 1rem' : '1rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              background: isPills
                ? isActive
                  ? 'var(--primary-light)'
                  : 'transparent'
                : 'transparent',
              border: 'none',
              borderBottom: isPills ? 'none' : isActive ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: isPills ? '0.5rem' : '0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
          >
            {Icon && <Icon size={16} />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
