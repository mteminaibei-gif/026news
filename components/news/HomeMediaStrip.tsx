'use client'

import Link from 'next/link'
import { Radio, Tv, ExternalLink } from 'lucide-react'

export function HomeMediaStrip() {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="feed-heading" style={{ marginBottom: 0, fontSize: '1.25rem', fontWeight: 700 }}>Live Media</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/radio" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', padding: '8px 16px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={14} /> Radio
          </Link>
          <Link href="/tv" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', padding: '8px 16px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tv size={14} /> TV
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Radio Card */}
        <Link href="/radio" className="card-glass p-6 group hover:-translate-y-1 transition-all duration-300" style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <Radio size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Listen Live</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Kenyan radio stations</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Explore stations</span>
            <ExternalLink size={16} style={{ color: 'var(--primary)', opacity: 0.7, transition: 'transform 0.2s' }} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* TV Card */}
        <Link href="/tv" className="card-glass p-6 group hover:-translate-y-1 transition-all duration-300" style={{ borderRadius: 16, border: '1px solid var(--border-subtle)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
              <Tv size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Watch Live</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Kenyan TV channels</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Explore channels</span>
            <ExternalLink size={16} style={{ color: 'var(--primary)', opacity: 0.7, transition: 'transform 0.2s' }} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </section>
  )
}