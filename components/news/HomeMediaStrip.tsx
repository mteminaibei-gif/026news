'use client'

import Link from 'next/link'
import { Radio, Tv, Headphones, Play } from 'lucide-react'

export function HomeMediaStrip() {
  return (
    <section style={{ marginBottom: 48, maxWidth: 1200, marginInline: 'auto', paddingInline: 'var(--space-md)', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="feed-heading" style={{ marginBottom: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' }}>
            <Play size={14} fill="#fff" />
          </span>
          Live Media
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/radio" style={{
            fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none',
            padding: '6px 14px', background: 'var(--primary-light)', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
          }}>
            All Radio
          </Link>
          <Link href="/tv" style={{
            fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none',
            padding: '6px 14px', background: 'var(--accent-light)', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
          }}>
            All TV
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {/* Radio Card */}
        <Link href="/radio" style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))',
          border: '1px solid rgba(239,68,68,0.12)', borderRadius: 14,
          textDecoration: 'none', color: 'inherit', transition: 'all 0.25s',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Pulsing dot */}
          <div style={{ position: 'absolute', top: 14, right: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#ef4444', animation: 'pulse 2s infinite' }} />
              Live
            </span>
          </div>

          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(239,68,68,0.25)', flexShrink: 0,
          }}>
            <Headphones size={24} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Listen Live</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.3 }}>Kenyan radio stations — Capital, Nation, KBC & more</div>
          </div>
          <Radio size={18} style={{ color: '#ef4444', opacity: 0.6, flexShrink: 0 }} />
        </Link>

        {/* TV Card */}
        <Link href="/tv" style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0.02))',
          border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14,
          textDecoration: 'none', color: 'inherit', transition: 'all 0.25s',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Pulsing dot */}
          <div style={{ position: 'absolute', top: 14, right: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#3b82f6', animation: 'pulse 2s infinite' }} />
              Live
            </span>
          </div>

          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.25)', flexShrink: 0,
          }}>
            <Tv size={24} color="#fff" strokeWidth={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Watch Live</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.3 }}>Kenyan TV — NTV, Citizen, KTN & international channels</div>
          </div>
          <Tv size={18} style={{ color: '#3b82f6', opacity: 0.6, flexShrink: 0 }} />
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </section>
  )
}
